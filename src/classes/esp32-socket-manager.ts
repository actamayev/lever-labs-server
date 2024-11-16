
import _ from "lodash"
import { IncomingMessage } from "http"
import { Server as WSServer } from "ws"
import Singleton from "./singleton"
import isPipUUID from "../utils/type-checks"
import BrowserSocketManager from "./browser-socket-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()
	private pingIntervals = new Map<string, NodeJS.Timeout>()  // Track intervals by socketId
	private chunkSize = 12 * 1024 // 12KB

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

	private initializeListeners(): void {
		this.wss.on("connection", (ws: ExtendedWebSocket, req: IncomingMessage) => {
			const socketId = req.headers["sec-websocket-key"] as string
			console.info(`ESP32 connected: ${socketId}`)

			let isRegistered = false

			// Set up ping/pong
			ws.isAlive = true
			ws.on("pong", () => {
				ws.isAlive = true
				console.debug(`Pong received from ${socketId}`)
			})

			// Store interval reference
			const interval = this.setupPingInterval(socketId, ws)

			ws.on("message", (message) => {
				this.handleMessage(socketId, message.toString(), isRegistered, (registered) => {
					isRegistered = registered
				}, ws)
			})

			ws.on("close", () => {
				console.log(`WebSocket closed for ${socketId}`)
				this.cleanupConnection(socketId, ws, interval)
			})

			ws.on("error", (error) => {
				console.error(`WebSocket error for ${socketId}:`, error)
				this.cleanupConnection(socketId, ws, interval)
			})
		})
	}

	private setupPingInterval(socketId: string, ws: ExtendedWebSocket): NodeJS.Timeout {
		const interval = setInterval(() => {
			if (!ws.isAlive) {
				console.info(`Terminating inactive connection for socketId: ${socketId}`)
				this.cleanupConnection(socketId, ws, interval)
				return
			}
			ws.isAlive = false
			ws.ping(() => {
				console.debug(`Ping sent to ${socketId}`)
			})
		}, 15000)

		this.pingIntervals.set(socketId, interval)
		return interval
	}

	private cleanupConnection(socketId: string, ws: ExtendedWebSocket, interval: NodeJS.Timeout | undefined): void {
		// Clear the ping interval
		clearInterval(interval)
		this.pingIntervals.delete(socketId)

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
				existingConnection.socket,
				this.pingIntervals.get(existingConnection.socketId)
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
		if (connection) {
			connection.status = "inactive"
			BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "inactive")
			this.connections.delete(pipUUID)
		}
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

	private setupStatusHandler(socket: ExtendedWebSocket, socketId: string): (data: string) => void {
		return (data: string) => {
			try {
				const message = JSON.parse(data)
				if (message.event === "update_status" && message.status === "error") {
					console.error(`ESP reported error: ${message.error}`)
					this.setupPingInterval(socketId, socket)
					return false
				}
			} catch (e) {
				console.error(e)
				throw e
				// Handle non-JSON messages
			}
			return true
		}
	}

	private createChunkMessage(
		chunkIndex: number,
		totalChunks: number,
		totalSize: number,
		data: string
	): object {
		return {
			event: "new-user-code",
			chunkIndex,
			totalChunks,
			totalSize,
			isLast: chunkIndex === totalChunks - 1,
			data
		}
	}

	private async sendChunk(
		socket: ExtendedWebSocket,
		message: object
	): Promise<boolean> {
		return await new Promise((resolve) => {
			socket.send(JSON.stringify(message), (error) => {
				if (error) {
					console.error("Failed to send chunk:", error)
					resolve(false)
				}
				resolve(true)
			})
		})
	}

	private async sendAllChunks(
		socket: ExtendedWebSocket,
		base64Data: string,
		totalSize: number,
		chunks: number
	): Promise<boolean> {
		for (let currentChunk = 0; currentChunk < chunks; currentChunk++) {
			const start = currentChunk * this.chunkSize
			const end = Math.min(start + this.chunkSize, base64Data.length)
			const chunk = base64Data.slice(start, end)

			const message = this.createChunkMessage(
				currentChunk,
				chunks,
				totalSize,
				chunk
			)

			const success = await this.sendChunk(socket, message)
			if (!success) {
				return false
			}

			// Add delay between chunks
			await new Promise(resolve => setTimeout(resolve, 250))
		}

		return true
	}

	public async emitBinaryCodeToPip(pipUUID: PipUUID, binary: Buffer): Promise<void> {
		try {
			const connectionInfo = this.connections.get(pipUUID)
			if (!connectionInfo) {
				throw Error("Pip Not connected")
			}

			// Pause ping-pong checks during transfer
			const interval = this.pingIntervals.get(connectionInfo.socketId)
			if (interval) {
				clearInterval(interval)
				this.pingIntervals.delete(connectionInfo.socketId)
			}

			// Setup status handler
			const statusHandler = this.setupStatusHandler(
				connectionInfo.socket,
				connectionInfo.socketId
			)
			connectionInfo.socket.on("message", statusHandler)

			// Prepare data
			const base64Data = binary.toString("base64")
			const chunks = Math.ceil(base64Data.length / this.chunkSize)

			console.log(`Starting transfer of ${binary.length} bytes in ${chunks} chunks`)

			// Send all chunks
			const success = await this.sendAllChunks(
				connectionInfo.socket,
				base64Data,
				binary.length,
				chunks
			)

			// Cleanup
			this.setupPingInterval(connectionInfo.socketId, connectionInfo.socket)

			if (success) {
				console.log(`Successfully sent all ${chunks} chunks to ${pipUUID}`)
			} else {
				console.log("Transfer stopped due to error")
			}

		} catch (error) {
			console.error(`Failed to send binary code to pip ${pipUUID}:`, error)
			throw error
		}
	}
}
