import { Server as WSServer } from "ws"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { ESPToServerMessage } from "@bluedotrobots/common-ts/types/pip"
import Singleton from "../singleton"
import isPipUUID from "../../utils/type-helpers/type-checks"
import BrowserSocketManager from "../browser-socket-manager"
import SingleESP32Connection from "./single-esp32-connection"
import SendEsp32MessageManager from "./send-esp32-message-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()

	private constructor(private readonly wss: WSServer) {
		super()
		this.initializeWSServer()
		// TODO 9/21/25: Consider loading in all the pips from DB here
		// When we restart the server, and when we add a new pip (add new pip uuid) we need to reload the pips from DB
	}

	public static override getInstance(wss?: WSServer): Esp32SocketManager {
		if (!Esp32SocketManager.instance) {
			if (!wss) {
				throw new Error("WebSocket Server instance required to initialize Esp32SocketManager")
			}
			Esp32SocketManager.instance = new Esp32SocketManager(wss)
		}
		return Esp32SocketManager.instance
	}

	private initializeWSServer(): void {
		this.wss.on("connection", (socket: ExtendedWebSocket, request) => {
			// Extract pipId from headers
			const pipId = request.headers["x-pip-id"] as string

			if (!pipId || !isPipUUID(pipId)) {
				console.warn("Invalid or missing X-Pip-Id header")
				socket.close(1002, "Invalid or missing X-Pip-Id header")
				return
			}

			console.info(`ESP32 ${pipId} connected - registering immediately`)

			socket.pipId = pipId

			// ✅ IMMEDIATE REGISTRATION - happens right when WebSocket connects
			const connection = new SingleESP32Connection(
				pipId,
				socket,
				(disconnectedPipId: PipUUID) => this.handleDisconnection(disconnectedPipId)
			)

			// ✅ TRACK ACTIVE CONNECTIONS - this replaces your registration message
			this.registerConnection(pipId, connection)

			socket.on("message", (message) => {
				this.handleOngoingMessage(pipId, message.toString())
			})
		})
	}

	private handleOngoingMessage(
		pipId: PipUUID,
		message: string
	): void {
		try {
			const parsed = JSON.parse(message) as ESPToServerMessage
			const { route, payload } = parsed

			this.updateLastActivity(pipId)

			switch (route) {
			case "/device-initial-data":
				void SendEsp32MessageManager.getInstance().transferUpdateAvailableMessage(pipId, payload)
				break
			case "/sensor-data":
				BrowserSocketManager.getInstance().sendBrowserPipSensorData(pipId, payload)
				break
			case "/sensor-data-mz":
				BrowserSocketManager.getInstance().sendBrowserPipSensorDataMZ(pipId, payload)
				break
			case "/battery-monitor-data-full":
				BrowserSocketManager.getInstance().emitPipBatteryData(pipId, payload.batteryData)
				break
			case "/pip-turning-off":
				this.handleDisconnection(pipId)
				break
			case "/dino-score":
				BrowserSocketManager.getInstance().emitPipDinoScore(pipId, payload.score)
				break
			default:
				console.warn(`Unknown route from ${pipId}: ${route}`)
				break
			}
		} catch (error) {
			console.error(`Failed to process message from ${pipId}:`, error)
		}
	}

	private updateLastActivity(pipId: PipUUID): void {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return
		// Reset the ping counter since we received data
		connectionInfo.connection.resetPingCounter()
	}

	private registerConnection(pipId: PipUUID, connection: SingleESP32Connection): void {
		const existing = this.connections.get(pipId)

		if (!existing) {
			// ✅ NEW CONNECTION - track it immediately
			const initialStatus = this.createInitialStatus()
			this.connections.set(pipId, { status: initialStatus, connection })
			return
		}
		console.info(`ESP32 ${pipId} reconnecting, replacing existing connection`)
		existing.connection.dispose()

		if (existing.status.connectedToSerialUserId) {
			this.connections.set(pipId, {
				status: { ...existing.status, online: true },
				connection
			})
		} else {
			const initialStatus = this.createInitialStatus()
			this.connections.set(pipId, { status: initialStatus, connection })
		}
	}

	private handleDisconnection(pipId: PipUUID): void {
		console.info(`ESP32 disconnected: ${pipId}`)

		// Get the connection before updating
		const connectionInfo = this.connections.get(pipId)

		// Update status to offline but preserve serial connection if it exists
		if (!connectionInfo) return
		const updatedStatus: ESPConnectionState = {
			...connectionInfo.status,
			online: false,
			connectedToOnlineUserId: null
		}

		this.connections.set(pipId, {
			...connectionInfo,
			status: updatedStatus
		})

		// Dispose of the connection object to stop ping intervals and clean up
		connectionInfo.connection.dispose()
		const userConnectedToOnlineBeforeDisconnection = connectionInfo.status.connectedToOnlineUserId
		if (userConnectedToOnlineBeforeDisconnection) {
			BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(userConnectedToOnlineBeforeDisconnection, pipId, "offline")
		}
		const userConnectedToSerialBeforeDisconnection = connectionInfo.status.connectedToSerialUserId
		if (userConnectedToSerialBeforeDisconnection) {
			BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(
				userConnectedToSerialBeforeDisconnection, pipId, "connected to serial to you"
			)
		}
	}

	public getESPStatus(pipId: PipUUID): ESPConnectionState | undefined {
		return this.connections.get(pipId)?.status
	}

	public getConnection(pipId: PipUUID): SingleESP32Connection | undefined {
		return this.connections.get(pipId)?.connection
	}

	public isPipUUIDConnected(pipId: PipUUID): boolean {
		const status = this.getESPStatus(pipId)
		return status?.online || false
	}

	public getAllConnectedPipUUIDs(): PipUUID[] {
		const connectedPipUUIDs: PipUUID[] = []
		for (const [pipId, connectionInfo] of this.connections) {
			if (connectionInfo.status.online) {
				connectedPipUUIDs.push(pipId)
			}
		}
		return connectedPipUUIDs
	}

	// Updated methods for managing connection states
	private handleSerialConnect(pipId: PipUUID, userId: number, connectionInfo?: ESP32SocketConnectionInfo): void {
		if (!connectionInfo) {
			// Create connection info for offline + serial case
			this.connections.set(pipId, {
				status: {
					online: false,
					connectedToOnlineUserId: null,
					lastOnlineConnectedUserId: null,
					connectedToSerialUserId: userId
				},
				connection: null as unknown as SingleESP32Connection
			})
			return
		}
		// Serial connection trumps online user connection
		this.connections.set(pipId, {
			...connectionInfo,
			status: {
				...connectionInfo.status,
				connectedToSerialUserId: userId,
				connectedToOnlineUserId: null
			}
		})

		const onlineConnectedUserId = connectionInfo.status.connectedToOnlineUserId

		// If user was connected, disconnect them from browser side
		if (
			!onlineConnectedUserId ||
			onlineConnectedUserId === userId
		) return
		BrowserSocketManager.getInstance().disconnectOnlineUserFromPip(pipId, onlineConnectedUserId)
	}

	private handleSerialDisconnect(pipId: PipUUID, connectionInfo: ESP32SocketConnectionInfo): void {
		const updatedStatus: ESPConnectionState = {
			...connectionInfo.status,
			connectedToSerialUserId: null
		}
		this.connections.set(pipId, {
			...connectionInfo,
			status: updatedStatus
		})
	}

	public setOnlineUserConnected(pipId: PipUUID, userId: number): boolean {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return false
		if (connectionInfo.status.connectedToSerialUserId) {
			console.warn(`Cannot connect user to ${pipId}: serial connection is active`)
			return false
		}
		this.connections.set(pipId, {
			...connectionInfo,
			status: {
				...connectionInfo.status,
				connectedToOnlineUserId: userId,
				lastOnlineConnectedUserId: userId
			}
		})

		BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(userId, pipId)
		return true
	}

	public setOnlineUserDisconnected(pipId: PipUUID, userId: number): boolean {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return false
		this.connections.set(pipId, {
			...connectionInfo,
			status: { ...connectionInfo.status, connectedToOnlineUserId: null }
		})
		BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(userId, null)
		return true
	}

	public setSerialConnection(pipId: PipUUID, userId: number): boolean {
		const connectionInfo = this.connections.get(pipId)
		// Serial connection trumps user connection - always allow serial to connect
		this.handleSerialConnect(pipId, userId, connectionInfo)
		const status = this.getESPStatus(pipId)
		if (!status) return false
		if (status.connectedToOnlineUserId && status.connectedToOnlineUserId !== userId) {
			BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(
				status.connectedToOnlineUserId, pipId, "connected to serial to another user"
			)
		}
		return true
	}

	public setSerialDisconnection(pipId: PipUUID, userId: number): boolean {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return false
		this.handleSerialDisconnect(pipId, connectionInfo)
		const status = this.getESPStatus(pipId)
		if (!status) return false
		if (status.connectedToSerialUserId && status.lastOnlineConnectedUserId !== userId && status.lastOnlineConnectedUserId) {
			// Auto-reconnect after other user disconnects serial
			this.setOnlineUserConnected(pipId, status.lastOnlineConnectedUserId)
			BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(
				status.connectedToSerialUserId, pipId, "connected online to you"
			)
		}
		return true
	}

	private createInitialStatus(): ESPConnectionState {
		return {
			online: true,
			connectedToOnlineUserId: null,
			connectedToSerialUserId: null,
			lastOnlineConnectedUserId: null
		}
	}
}
