import { IncomingMessage } from "http"
import { Server as WSServer } from "ws"
import Singleton from "../singleton"
import isPipUUID from "../../utils/type-checks"
import BrowserSocketManager from "../browser-socket-manager"
import SingleESP32Connection from "./single-esp32-connection"
import ESP32FirmwareUpdateManager from "./esp32-firmware-update-manager"
import ESP32LabDemoDataManager from "./esp32-lab-demo-data-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()
	private readonly esp32FirmwareUpdateManager: ESP32FirmwareUpdateManager
	private readonly esp32LabDemoDataManager: ESP32LabDemoDataManager

	// This map is redundant, but it's faster to search this map for a uuid directly than finding from the connections map
	private socketToPip = new Map<string, PipUUID>() // socketId--> PipUUID

	private constructor(private readonly wss: WSServer) {
		super()
		this.initializeWSServer()
		this.esp32FirmwareUpdateManager = ESP32FirmwareUpdateManager.getInstance()
		this.esp32LabDemoDataManager = ESP32LabDemoDataManager.getInstance()
	}

	public static getInstance(wss?: WSServer): Esp32SocketManager {
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

			// Wait for registration message
			socket.once("message", (message) => {
				this.handleRegistration(socketId, message.toString(), connection)
			})
		})
	}

	private handleRegistration(
		socketId: string,
		message: string,
		connection: SingleESP32Connection
	): void {
		try {
			const { pipUUID } = JSON.parse(message)

			if (!isPipUUID(pipUUID)) {
				console.warn(`Invalid registration from ${socketId}`)
				connection.dispose()
				return
			}

			this.registerConnection(socketId, pipUUID, connection)
		} catch (error) {
			console.error(`Registration failed for ${socketId}:`, error)
			connection.dispose()
		}
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
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "inactive")
	}

	public getESPStatus(pipUUID: PipUUID): ESPConnectionStatus {
		return this.connections.get(pipUUID)?.status || "inactive"
	}

	private getConnection(pipUUID: PipUUID): SingleESP32Connection | undefined {
		return this.connections.get(pipUUID)?.connection
	}

	public isPipUUIDConnected(pipUUID: PipUUID): boolean {
		const connectionInfo = this.connections.get(pipUUID)
		return connectionInfo?.status === "connected" || false
	}

	public async emitBinaryCodeToPip(pipUUID: PipUUID, binary: Buffer): Promise<void> {
		const connection = this.getConnection(pipUUID)
		if (!connection) {
			throw new Error(`No active connection for PIP ${pipUUID}`)
		}

		try {
			await this.esp32FirmwareUpdateManager.transferBinaryData(connection, binary)
		} catch (error) {
			console.error(`Failed to transfer code to PIP ${pipUUID}:`, error)
			throw error
		}
	}

	public async emitMotorControlToPip(motorControlData: IncomingMotorControlData): Promise<void> {
		const connection = this.getConnection(motorControlData.pipUUID)
		if (!connection) {
			throw new Error(`No active connection for PIP ${motorControlData.pipUUID}`)
		}

		try {
			await this.esp32LabDemoDataManager.transferMotorControlData(connection.socket, motorControlData)
		} catch (error) {
			console.error(`Failed to transfer code to PIP ${motorControlData.pipUUID}:`, error)
			throw error
		}
	}
}
