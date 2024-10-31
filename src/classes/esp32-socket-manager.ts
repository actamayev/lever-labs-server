import WebSocket, { Server as WSServer } from "ws"
import Singleton from "./singleton"
import isPipUUID from "../utils/type-checks"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<string, ESP32SocketConnectionInfo>() // Maps socketId to ESP32SocketConnectionInfo

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
		this.wss.on("connection", (ws: WebSocket, req) => {
			const socketId = req.headers["sec-websocket-key"] as string
			console.log(`ESP32 connected: ${socketId}`)

			ws.once("message", (message) => {
				const pipUUID = message.toString() // Treat the first message as the UUID
				if (!isPipUUID(pipUUID)) return
				this.addConnection(socketId, pipUUID)
				console.log(`Registered new ESP32 connection with UUID: ${pipUUID}`)
			  })

			ws.on("close", () => this.handleDisconnection(socketId))
			ws.on("message", (message) => this.handleMessage(socketId, message.toString()))
		})
	}

	private handleMessage(clientId: string, message: string): void {
		console.log(`Message from ESP32 (${clientId}):`, message)
	}

	public addConnection(socketId: string, pipUUID: PipUUID): void {
		this.connections.set(socketId, { pipUUID, status: "connected"})
	}

	public handleDisconnection(socketId: string): void {
		if (!this.connections.has(socketId)) return
		this.connections.delete(socketId)
		console.log(`Disconnected: ${socketId}`)
	}
}
