import _ from "lodash"
import { IncomingMessage } from "http"
import { Server as WSServer } from "ws"
import Singleton from "./singleton"
import isPipUUID from "../utils/type-checks"
import BrowserSocketManager from "./browser-socket-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()
	private pingIntervals = new Map<string, NodeJS.Timeout>()  // Track intervals by socketId

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


	public emitBinaryCodeToPip(pipUUID: PipUUID, binary: Buffer): void {
		try {
			const connectionInfo = this.connections.get(pipUUID)
			if (!connectionInfo || connectionInfo.socket.readyState !== connectionInfo.socket.OPEN) {
				throw Error("Pip not connected or socket not open")
			}

			// Pause ping-pong
			const interval = this.pingIntervals.get(connectionInfo.socketId)
			if (interval) {
				clearInterval(interval)
				this.pingIntervals.delete(connectionInfo.socketId)
			}

			console.log(`Sending ${binary.length} bytes to ${pipUUID}`)

			const message = {
				event: "new-user-code",
				data: binary.toString("base64")
			}

			connectionInfo.socket.send(JSON.stringify(message), (error) => {
				if (error) {
					console.error(`Failed to send update to ${pipUUID}:`, error)
					this.cleanupConnection(connectionInfo.socketId, connectionInfo.socket, interval)
				} else {
					console.log(`Update sent to ${pipUUID}, waiting for restart...`)
					setTimeout(() => {
						if (this.connections.has(pipUUID)) {
							this.cleanupConnection(connectionInfo.socketId, connectionInfo.socket, interval)
						}
					}, 30000)
				}
			})
		} catch (error) {
			console.error(`Failed to send binary code to pip ${pipUUID}:`, error)
			throw error
		}
	}
}
