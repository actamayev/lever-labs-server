import _ from "lodash"
import { IncomingMessage } from "http"
import { Server as WSServer } from "ws"
import Singleton from "./singleton"
import isPipUUID from "../utils/type-checks"
import BrowserSocketManager from "./browser-socket-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>() // Maps pipUUID to ESP32SocketConnectionInfo

	private constructor(private readonly wss: WSServer) {
		super()
		this.initializeListeners()
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

	// Configure WebSocket with ping/pong and timeout settings
	private initializeListeners(): void {
		this.wss.on("connection", (ws: ExtendedWebSocket, req: IncomingMessage) => {
			const socketId = req.headers["sec-websocket-key"] as string
			console.info(`ESP32 connected: ${socketId}`)

			let isRegistered = false

			// Set up ping/pong interval to detect inactive clients
			ws.isAlive = true
			ws.on("pong", () => {
				ws.isAlive = true
			})

			const interval = setInterval(() => {
				if (!ws.isAlive) {
					console.info(`Terminating inactive connection for socketId: ${socketId}`)
					this.handleDisconnectionBySocketId(socketId)
					return ws.terminate()
				}
				ws.isAlive = false
				ws.ping() // Send ping and wait for pong response
			}, 30000) // Check every 30 seconds

			ws.on("message", (message) => {
				this.handleMessage(socketId, message.toString(), isRegistered, (registered) => {
					isRegistered = registered
				})
			})

			ws.on("close", () => {
				clearInterval(interval)
				this.handleDisconnectionBySocketId(socketId)
			})
		})
	}

	// handleMessage handles both registration and regular message handling
	private handleMessage(
		clientId: string,
		message: string,
		isRegistered: boolean,
		setRegistered: (status: boolean) => void
	): void {
		console.info(`Message from ESP32 (${clientId}):`, message)

		if (isRegistered) {
			// Handle regular messages
			console.info(`Regular message from ESP32 (${clientId}):`, message)
			return
		}

		// Handle first message as registration
		try {
			const data = JSON.parse(message) as { pipUUID?: string }

			const pipUUID = data.pipUUID
			// Check if pipUUID exists
			if (_.isUndefined(pipUUID)) {
				console.warn(`No pipUUID found in message from ESP32 (${clientId}):`, message)
				return
			}

			// Validate pipUUID
			if (!isPipUUID(pipUUID)) {
				console.warn(`Invalid UUID received from ESP32 (${clientId}):`, pipUUID)
				return
			}

			// Register the connection
			this.addConnection(clientId, pipUUID)
			console.info(`Registered new ESP32 connection with UUID: ${pipUUID}`)
			setRegistered(true)  // Update isRegistered to true
		} catch (error) {
			console.error(`Failed to parse message from ESP32 (${clientId}):`, error)
		}
	}

	private addConnection(socketId: string, pipUUID: PipUUID): void {
		console.log("ESP adding new connection")
		this.connections.set(pipUUID, { socketId, status: "connected" })
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "online")
	}

	private handleDisconnectionBySocketId(socketId: string): void {
		const pipUUID = this.getPipUUIDBySocketId(socketId)
		if (!pipUUID) return

		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "inactive")
		this.connections.delete(pipUUID)
	}

	// Helper function to retrieve pipUUID by socketId
	private getPipUUIDBySocketId(socketId: string): PipUUID | undefined {
		for (const [uuid, connectionInfo] of this.connections.entries()) {
			if (connectionInfo.socketId === socketId) {
				return uuid
			}
		}
		return undefined
	}

	public isPipUUIDConnected(pipUUID: PipUUID): boolean {
		const connectionInfo = this.connections.get(pipUUID)
		return connectionInfo?.status === "connected" || false
	}

	public getESPStatus(pipUUID: PipUUID): ESPConnectionStatus {
		const connectionInfo = this.connections.get(pipUUID)
		return connectionInfo?.status || "inactive"
	}
}
