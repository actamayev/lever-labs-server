import WebSocket, { Server as WSServer } from "ws"
import Singleton from "./singleton"

export default class Esp32SocketManager extends Singleton {
	private _esp32Connections: Map<string, SocketConnectionInfo> = new Map<string, SocketConnectionInfo>()

	constructor(private readonly wss: WSServer) {
		super()
		this.initializeListeners()
	}

	get esp32Connections(): Map<string, SocketConnectionInfo> {
		return this._esp32Connections
	}

	set esp32Connections(value: Map<string, SocketConnectionInfo>) {
		this._esp32Connections = value
	}

	public static assignWsServer(wss: WSServer): void {
		if (Esp32SocketManager.instance === null) {
			Esp32SocketManager.instance = new Esp32SocketManager(wss)
		} else {
			throw new Error("Esp32SocketManager instance has already been initialized")
		}
	}

	public static getInstance(): Esp32SocketManager {
		if (Esp32SocketManager.instance === null) {
			throw new Error("Esp32SocketManager instance is not initialized. Call assignWsServer first.")
		}
		return Esp32SocketManager.instance
	}

	private initializeListeners(): void {
		this.wss.on("connection", (ws: WebSocket, request) => {
			const clientId = request.headers["sec-websocket-key"] as string
			console.log(`ESP32 connected: ${clientId}`)
			this.handleConnection(clientId, ws)

			ws.on("close", () => this.handleDisconnect(clientId))
			ws.on("message", (message) => this.handleMessage(clientId, message.toString()))
		})
	}

	private handleConnection(clientId: string, ws: WebSocket): void {
		this._esp32Connections.set(clientId, { socketId: clientId, status: "active" })
		ws.send(JSON.stringify({ event: "connected", message: "Welcome ESP32 device!" }))
	}

	private handleMessage(clientId: string, message: string): void {
		console.log(`Message from ESP32 (${clientId}):`, message)
		// Handle incoming messages from ESP32 devices here
	}

	private handleDisconnect(clientId: string): void {
		if (this._esp32Connections.has(clientId)) {
			this._esp32Connections.delete(clientId)
			console.log(`ESP32 disconnected: ${clientId}`)
		}
	}

	public sendMessageToEsp32(clientId: string, message: string): void {
		const connection = this._esp32Connections.get(clientId)
		if (connection) {
			const ws = Array.from(this.wss.clients).find(client => client.readyState === WebSocket.OPEN && client.protocol === clientId)
			if (ws) {
				ws.send(message)
			}
		}
	}
}
