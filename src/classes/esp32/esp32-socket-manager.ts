import { IncomingMessage } from "http"
import { Server as WSServer } from "ws"
import Singleton from "../singleton"
import isPipUUID from "../../utils/type-checks"
import BrowserSocketManager from "../browser-socket-manager"
import SingleESP32Connection from "./single-esp32-connection"
import SendEsp32MessageManager from "./send-esp32-message-manager"
import { BatteryMonitorDataFull, BytecodeMessage, ESPConnectionStatus,
	ESPMessage, PipUUID, PipUUIDPayload, SensorPayload } from "@bluedotrobots/common-ts"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()

	// This map is redundant, but it's faster to search this map for a uuid directly than finding from the connections map
	private socketToPip = new Map<string, PipUUID>() // socketId--> PipUUID

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

	private initializeWSServer(): void {
		this.wss.on("connection", (socket: ExtendedWebSocket, req: IncomingMessage) => {
			const socketId = req.headers["sec-websocket-key"] as string
			console.info(`ESP32 connected: ${socketId}`)

			const connection = new SingleESP32Connection(
				socketId,
				socket,
				(newSocketId) => this.handleDisconnection(newSocketId)
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
		socketId: string,
		message: string,
		connection: SingleESP32Connection
	): void {
		try {
			const parsed = JSON.parse(message) as ESPMessage
			const { route, payload } = parsed

			if (route === "/register") {
				if (!isPipUUID((payload as PipUUIDPayload).pipUUID)) {
					console.warn(`Invalid registration from ${socketId}`)
					connection.dispose()
					return
				}
				this.registerConnection(socketId, (payload as PipUUIDPayload).pipUUID, connection)
				void SendEsp32MessageManager.getInstance().transferUpdateAvailableMessage(payload as PipUUIDPayload)
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
		socketId: string,
		socket: ExtendedWebSocket
	): void {
		socket.on("message", (message) => {
			this.handleOngoingMessage(socketId, message.toString())
		})
	}

	private handleOngoingMessage(
		socketId: string,
		message: string
	): void {
		try {
			const parsed = JSON.parse(message) as ESPMessage
			const { route, payload } = parsed

			switch (route) {
			case "/sensor-data":
				this.handleSensorData(socketId, payload as SensorPayload)
				break
			case "/bytecode-status":
				console.info("Bytecode status:", (payload as BytecodeMessage).message)
				break
			case "/battery-monitor-data-full":
				this.handleBatteryMonitorData(socketId, payload as BatteryMonitorDataFull)
				break
			default:
				console.warn(`Unknown route: ${route}`)
				break
			}
		} catch (error) {
			console.error(`Failed to process message from ${socketId}:`, error)
		}
	}

	private handleSensorData(
		socketId: string,
		payload: SensorPayload
	): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received sensor data from unregistered connection: ${socketId}`)
			return
		}

		// Forward to lab demo data manager
		BrowserSocketManager.getInstance().sendBrowserPipSensorData(pipUUID, payload)
	}

	private handleBatteryMonitorData(
		socketId: string,
		payload: BatteryMonitorDataFull
	): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received battery monitor data from unregistered connection: ${socketId}`)
			return
		}

		BrowserSocketManager.getInstance().emitPipBatteryData(pipUUID, payload.batteryData)
	}

	private registerConnection(
		socketId: string,
		pipUUID: PipUUID,
		connection: SingleESP32Connection
	): void {
		// Clean up any existing connection for this PIP
		const existing = this.connections.get(pipUUID)
		if (existing) existing.connection.dispose()

		// Set up new connection
		this.connections.set(pipUUID, {
			socketId,
			status: "connected",
			connection
		})
		this.socketToPip.set(socketId, pipUUID)

		// Notify of status change
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "online")
	}

	private handleDisconnection(socketId: string): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) return

		console.info(`ESP32 disconnected: ${socketId} (PIP: ${pipUUID})`)

		// Clean up mappings
		this.connections.delete(pipUUID)
		this.socketToPip.delete(socketId)

		// Notify of status change
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "offline")
	}

	public getESPStatus(pipUUID: PipUUID): ESPConnectionStatus {
		return this.connections.get(pipUUID)?.status || "offline"
	}

	public getConnection(pipUUID: PipUUID): SingleESP32Connection | undefined {
		return this.connections.get(pipUUID)?.connection
	}

	public isPipUUIDConnected(pipUUID: PipUUID): boolean {
		const connectionInfo = this.connections.get(pipUUID)
		return connectionInfo?.status === "connected" || false
	}
}
