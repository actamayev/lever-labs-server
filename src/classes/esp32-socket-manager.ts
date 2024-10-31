import WebSocket, { Server as WSServer } from "ws"
import Singleton from "./singleton"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, PipConnectionStatus>() // Maps UUID to ESP32SocketConnectionInfo

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

	protected initializeListeners(): void {
		this.wss.on("connection", (ws: WebSocket, req) => {
			const clientId = req.headers["sec-websocket-key"] as PipUUID
			console.log(`ESP32 connected: ${clientId}`)
			this.addConnection(clientId)

			ws.on("close", () => this.handleDisconnection(clientId))
			ws.on("message", (message) => this.handleMessage(clientId, message.toString()))
		})
	}

	private handleMessage(clientId: string, message: string): void {
		console.log(`Message from ESP32 (${clientId}):`, message)
	}

	public addConnection(pipUUID: PipUUID): void {
		this.connections.set(pipUUID, "connected")
	}

	public removeConnection(pipUUID: PipUUID): void {
		this.connections.delete(pipUUID)
	}

	public handleDisconnection(pipUUID: PipUUID): void {
		if (!this.connections.has(pipUUID)) return
		this.connections.delete(pipUUID)
		console.log(`Disconnected: ${pipUUID}`)
	}
}
