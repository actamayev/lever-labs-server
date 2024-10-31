import WebSocket, { Server as WSServer } from "ws"
import SocketManager from "./socket-manager"

export default class Esp32SocketManager extends SocketManager {
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
			const clientId = req.headers["sec-websocket-key"] as string
			console.log(`ESP32 connected: ${clientId}`)
			this.addConnection(clientId, { socketId: clientId, status: "connected" })

			ws.on("close", () => this.handleDisconnection(clientId))
			ws.on("message", (message) => this.handleMessage(clientId, message.toString()))
		})
	}

	private handleMessage(clientId: string, message: string): void {
		console.log(`Message from ESP32 (${clientId}):`, message)
	}
}
