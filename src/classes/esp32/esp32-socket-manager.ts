import _ from "lodash"
import { IncomingMessage } from "http"
import { Server as WSServer } from "ws"
import Singleton from "../singleton"
import isPipUUID from "../../utils/type-checks"
import ESP32DataTransferManager from "./esp32-data-transfer-manager"
import BrowserSocketManager from "../browser-socket-manager"
import ESP32PingManager from "./esp32-ping-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()
	private esp32PingManager: ESP32PingManager
	private esp32DataTransferManager: ESP32DataTransferManager

	private constructor(private readonly wss: WSServer) {
		super()
		this.esp32DataTransferManager = ESP32DataTransferManager.getInstance()
		this.esp32PingManager = ESP32PingManager.getInstance()
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

	private initializeListeners(): void {
		this.wss.on("connection", (ws: ExtendedWebSocket, req: IncomingMessage) => {
			const socketId = req.headers["sec-websocket-key"] as string
			console.info(`ESP32 connected: ${socketId}`)

			let isRegistered = false

			// Set up ping/pong
			ws.isAlive = true
			ws.on("pong", () => {
				ws.isAlive = true
				// console.debug(`Pong received from ${socketId}`)
			})

			ws.on("message", (message) => {
				this.handleMessage(socketId, message.toString(), isRegistered, (registered) => {
					isRegistered = registered
				}, ws)
			})

			ws.on("close", () => {
				console.info(`WebSocket closed for ${socketId}`)
				this.cleanupConnection(socketId, ws)
			})

			ws.on("error", (error) => {
				console.error(`WebSocket error for ${socketId}:`, error)
				this.cleanupConnection(socketId, ws)
			})
		})
	}

	private cleanupConnection(socketId: string, ws: ExtendedWebSocket): void {
		// Clear the ping interval
		this.esp32PingManager.clearPingInterval(socketId)

		// Terminate the WebSocket if it's still open
		if (ws.readyState !== ws.CLOSED) {
			ws.terminate()
		}

		// Handle disconnection
		console.log("Cleaning up connection for socket", socketId)
		this.handleDisconnectionBySocketId(socketId)
	}

	private handleMessage(
		clientId: string,
		message: string,
		isRegistered: boolean,
		setRegistered: (status: boolean) => void,
		ws: ExtendedWebSocket
	): void {
		if (!ws.isAlive) {
			console.warn(`Received message from inactive connection ${clientId}`)
			return
		}

		console.info(`Message from ESP32 (${clientId}):`, message)

		if (isRegistered) {
			console.info(`Regular message from ESP32 (${clientId}):`, message)
			return
		}

		try {
			const data = JSON.parse(message) as { pipUUID?: string }
			const pipUUID = data.pipUUID

			if (_.isUndefined(pipUUID)) {
				console.warn(`No pipUUID found in message from ESP32 (${clientId}):`, message)
				return
			}

			if (!isPipUUID(pipUUID)) {
				console.warn(`Invalid UUID received from ESP32 (${clientId}):`, pipUUID)
				return
			}

			this.addConnection(clientId, pipUUID, ws)
			console.info(`Registered new ESP32 connection with UUID: ${pipUUID}`)
			setRegistered(true)
		} catch (error) {
			console.error(`Failed to parse message from ESP32 (${clientId}):`, error)
		}
	}

	private addConnection(socketId: string, pipUUID: PipUUID, socket: ExtendedWebSocket): void {
		// Remove any existing connection for this pipUUID
		const existingConnection = this.connections.get(pipUUID)
		if (existingConnection) {
			this.cleanupConnection(
				existingConnection.socketId,
				existingConnection.socket
			)
		}

		console.info("ESP adding new connection")
		this.connections.set(pipUUID, {
			socketId,
			status: "connected",
			socket
		})
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "online")
	}

	private handleDisconnectionBySocketId(socketId: string): void {
		const pipUUID = this.getPipUUIDBySocketId(socketId)
		if (!pipUUID) {
			console.log(`No PIP UUID found for socket ID ${socketId}`)
			return
		}
		console.log(`Disconnecting socket for PIP ${pipUUID}`)

		const connection = this.connections.get(pipUUID)
		if (!connection) return

		connection.status = "inactive"
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "inactive")
		this.connections.delete(pipUUID)
	}

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

	// private setupStatusHandler(socket: ExtendedWebSocket, socketId: string): (data: string) => void {
	// 	return (data: string) => {
	// 		try {
	// 			const message = JSON.parse(data)
	// 			if (message.event === "update_status" && message.status === "error") {
	// 				console.error(`ESP reported error: ${message.error}`)
	// 				this.setupPingInterval(socketId, socket)
	// 				return false
	// 			}
	// 		} catch (e) {
	// 			console.error(e)
	// 			throw e
	// 			// Handle non-JSON messages
	// 		}
	// 		return true
	// 	}
	// }

	public async emitBinaryCodeToPip(pipUUID: PipUUID, binary: Buffer): Promise<void> {
		try {
			const connectionInfo = this.connections.get(pipUUID)
			if (!connectionInfo) {
				throw Error("Pip Not connected")
			}

			const success = await this.esp32DataTransferManager.transferBinaryData(
				connectionInfo.socket,
				connectionInfo.socketId,
				binary,
				this.cleanupConnection.bind(this)
			)

			if (!success) {
				throw new Error("Failed to transfer binary data")
			}

			// Pause ping-pong checks during transfer
			// const interval = this.pingIntervals.get(connectionInfo.socketId)
			// if (interval) {
			// 	clearInterval(interval)
			// 	this.pingIntervals.delete(connectionInfo.socketId)
			// }

			// // Perform the transfer
			// const success = await this.esp32DataTransferManager.transferBinaryData(
			// 	connectionInfo.socket,
			// 	connectionInfo.socketId,
			// 	binary
			// )

			// // Resume ping-pong checks
			// this.setupPingInterval(connectionInfo.socketId, connectionInfo.socket)

			// if (!success) {
			// 	throw new Error("Failed to transfer binary data")
			// }

		} catch (error) {
			console.error(`Failed to send binary code to pip ${pipUUID}:`, error)
			throw error
		}
	}
}
