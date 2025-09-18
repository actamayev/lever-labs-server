import { Server as WSServer } from "ws"
import { randomUUID, UUID } from "crypto"
import { BatteryMonitorDataFull,
	ESPMessage, SensorPayload, SensorPayloadMZ, DinoScorePayload } from "@bluedotrobots/common-ts/types/pip"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import Singleton from "../singleton"
import isPipUUID from "../../utils/type-helpers/type-checks"
import BrowserSocketManager from "../browser-socket-manager"
import SingleESP32Connection from "./single-esp32-connection"
import SendEsp32MessageManager from "./send-esp32-message-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()

	// This map is redundant, but it's faster to search this map for a uuid directly than finding from the connections map
	private socketToPip = new Map<UUID, PipUUID>() // socketId--> PipUUID

	private constructor(private readonly wss: WSServer) {
		super()
		this.initializeWSServer()
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

	// Helper method to create initial status when ESP connects
	private createInitialStatus(): ESPConnectionState {
		return {
			online: true,
			connectedToOnlineUser: false,
			connectedToSerial: false
		}
	}

	private initializeWSServer(): void {
		this.wss.on("connection", (socket: ExtendedWebSocket) => {
			const socketId = randomUUID()
			console.info(`ESP32 connected: ${socketId}`)

			const connection = new SingleESP32Connection(
				socketId,
				socket,
				(newSocketId: UUID) => this.handleDisconnection(newSocketId)
			)

			// Wait for registration message first
			socket.once("message", (message) => {
				this.handleRegistrationMessage(socketId, message.toString(), connection)

				// After registration, set up ongoing message handler
				this.setupOngoingMessageHandler(socketId, socket)
			})
		})
	}

	private handleRegistrationMessage(
		socketId: UUID,
		message: string,
		connection: SingleESP32Connection
	): void {
		try {
			const parsed = JSON.parse(message) as ESPMessage
			const { route, payload } = parsed

			if (route === "/register") {
				if (!isPipUUID(payload.pipUUID)) {
					console.warn(`Invalid registration from ${socketId}`)
					connection.dispose()
					return
				}
				this.registerConnection(socketId, payload.pipUUID, connection)
				void SendEsp32MessageManager.getInstance().transferUpdateAvailableMessage(payload)
			} else {
				console.warn(`Expected registration message, got: ${route}`)
				connection.dispose()
			}
		} catch (error) {
			console.error(`Failed to process registration message from ${socketId}:`, error)
			connection.dispose()
		}
	}

	private setupOngoingMessageHandler(
		socketId: UUID,
		socket: ExtendedWebSocket
	): void {
		socket.on("message", (message) => {
			this.handleOngoingMessage(socketId, message.toString())
		})
	}

	private handleOngoingMessage(
		socketId: UUID,
		message: string
	): void {
		try {
			const parsed = JSON.parse(message) as ESPMessage
			const { route, payload } = parsed
			this.updateLastActivity(socketId)

			switch (route) {
			case "/sensor-data":
				this.handleSensorData(socketId, payload)
				break
			case "/sensor-data-mz":
				this.handleSensorDataMZ(socketId, payload)
				break
			case "/battery-monitor-data-full":
				this.handleBatteryMonitorData(socketId, payload)
				break
			case "/pip-turning-off":
				this.handlePipTurningOff(socketId)
				break
			case "/dino-score":
				this.handleDinoScore(socketId, payload)
				break
			default:
				console.warn(`Unknown route: ${route}`)
				break
			}
		} catch (error) {
			console.error(`Failed to process message from ${socketId}:`, error)
		}
	}

	private updateLastActivity(socketId: UUID): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (pipUUID) {
			const connectionInfo = this.connections.get(pipUUID)
			if (connectionInfo) {
				// Reset the ping counter since we received data
				connectionInfo.connection.resetPingCounter()
			}
		}
	}

	// TODO: Create a re-usable method for sending this type of data (see handleSensorData, handleSensorDataMZ, etc.)
	private handleSensorData(
		socketId: UUID,
		payload: SensorPayload
	): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received sensor data from unregistered connection: ${socketId}`)
			return
		}

		BrowserSocketManager.getInstance().sendBrowserPipSensorData(pipUUID, payload)
	}

	private handleSensorDataMZ(
		socketId: UUID,
		payload: SensorPayloadMZ
	): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received sensor data from unregistered connection: ${socketId}`)
			return
		}

		BrowserSocketManager.getInstance().sendBrowserPipSensorDataMZ(pipUUID, payload)
	}

	private handleBatteryMonitorData(
		socketId: UUID,
		payload: BatteryMonitorDataFull
	): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received battery monitor data from unregistered connection: ${socketId}`)
			return
		}

		BrowserSocketManager.getInstance().emitPipBatteryData(pipUUID, payload.batteryData)
	}

	private handlePipTurningOff(socketId: UUID): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received pip turning off from unregistered connection: ${socketId}`)
			return
		}
		this.handleDisconnection(socketId)
	}

	private handleDinoScore(socketId: UUID, payload: DinoScorePayload): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received dino score from unregistered connection: ${socketId}`)
			return
		}

		BrowserSocketManager.getInstance().emitPipDinoScore(pipUUID, payload.score)
	}

	private registerConnection(
		socketId: UUID,
		pipUUID: PipUUID,
		connection: SingleESP32Connection
	): void {
		// Clean up any existing connection for this PIP
		const existing = this.connections.get(pipUUID)
		if (existing && existing.status.connectedToSerial) {
			existing.status.connectedToOnlineUser = true
			return
		} else if (existing && existing.status.connectedToOnlineUser) {
			existing.connection.dispose()
		}

		// Set up new connection with initial status
		const initialStatus = this.createInitialStatus()
		this.connections.set(pipUUID, {
			socketId,
			status: initialStatus,
			connection
		})
		this.socketToPip.set(socketId, pipUUID)

		// Notify of status change
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, initialStatus)
	}

	private handleDisconnection(socketId: UUID): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) return

		console.info(`ESP32 disconnected: ${socketId} (PIP: ${pipUUID})`)

		// Get the connection before deleting from map
		const connectionInfo = this.connections.get(pipUUID)

		// Update status to offline but preserve serial connection if it exists
		if (connectionInfo) {
			const updatedStatus: ESPConnectionState = {
				online: false,
				connectedToOnlineUser: false,
				connectedToSerial: connectionInfo.status.connectedToSerial
			}

			// If still connected to serial, keep the connection info but mark as offline
			if (updatedStatus.connectedToSerial) {
				this.connections.set(pipUUID, {
					...connectionInfo,
					status: updatedStatus
				})
			} else {
				// No serial connection, completely remove
				this.connections.delete(pipUUID)
			}

			// Dispose of the connection object to stop ping intervals and clean up
			connectionInfo.connection.dispose()

			// Notify of status change
			BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, updatedStatus)
		} else {
			// Clean up mappings if no connection info found
			this.connections.delete(pipUUID)
		}

		// Always clean up socket mapping
		this.socketToPip.delete(socketId)
	}

	public getESPStatus(pipUUID: PipUUID): ESPConnectionState {
		return this.connections.get(pipUUID)?.status || {
			online: false,
			connectedToOnlineUser: false,
			connectedToSerial: false
		}
	}

	public getConnection(pipUUID: PipUUID): SingleESP32Connection | undefined {
		return this.connections.get(pipUUID)?.connection
	}

	public isPipUUIDConnected(pipUUID: PipUUID): boolean {
		const status = this.getESPStatus(pipUUID)
		return status.online
	}

	public getAllConnectedPipUUIDs(): PipUUID[] {
		const connectedPipUUIDs: PipUUID[] = []
		for (const [pipUUID, connectionInfo] of this.connections) {
			if (connectionInfo.status.online) {
				connectedPipUUIDs.push(pipUUID)
			}
		}
		return connectedPipUUIDs
	}

	// New methods for managing connection states
	private handleSerialConnect(pipUUID: PipUUID, connectionInfo?: ESP32SocketConnectionInfo): void {
		if (!connectionInfo) {
			// Create connection info for offline + serial case
			this.connections.set(pipUUID, {
				socketId: "", // No socket for serial-only connection
				status: {
					online: false,
					connectedToOnlineUser: false,
					connectedToSerial: true
				},
				connection: null as unknown as SingleESP32Connection
			})
		} else {
			// Serial connection trumps online user connection
			const wasConnectedToUser = connectionInfo.status.connectedToOnlineUser
			const updatedStatus: ESPConnectionState = {
				...connectionInfo.status,
				connectedToSerial: true
			}

			this.connections.set(pipUUID, {
				...connectionInfo,
				status: updatedStatus
			})

			// If user was connected, disconnect them from browser side
			if (wasConnectedToUser) {
				BrowserSocketManager.getInstance().disconnectUserFromPip(pipUUID)
			}
		}
	}

	private handleSerialDisconnect(pipUUID: PipUUID, connectionInfo: ESP32SocketConnectionInfo): void {
		const updatedStatus: ESPConnectionState = {
			...connectionInfo.status,
			connectedToSerial: false
		}

		// If not online and not connected to serial, remove completely
		if (!updatedStatus.online && !updatedStatus.connectedToSerial) {
			this.connections.delete(pipUUID)
		} else {
			this.connections.set(pipUUID, {
				...connectionInfo,
				status: updatedStatus
			})
		}
	}

	public setUserConnection(pipUUID: PipUUID, connected: boolean): boolean {
		const connectionInfo = this.connections.get(pipUUID)
		if (!connectionInfo) return false

		// Serial connection trumps user connection - can't connect user if serial is active
		if (connected && connectionInfo.status.connectedToSerial) {
			console.warn(`Cannot connect user to ${pipUUID}: serial connection is active`)
			return false
		}

		const updatedStatus: ESPConnectionState = {
			...connectionInfo.status,
			connectedToOnlineUser: connected
		}

		this.connections.set(pipUUID, {
			...connectionInfo,
			status: updatedStatus
		})

		// Notify of status change
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, updatedStatus)
		return true
	}

	public setSerialConnection(pipUUID: PipUUID, connected: boolean): boolean {
		const connectionInfo = this.connections.get(pipUUID)

		if (connected) {
			// Serial connection trumps user connection - always allow serial to connect
			this.handleSerialConnect(pipUUID, connectionInfo)
		} else {
			if (!connectionInfo) return false
			this.handleSerialDisconnect(pipUUID, connectionInfo)
		}

		// Notify of status change
		const status = this.getESPStatus(pipUUID)
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, status)
		return true
	}
}
