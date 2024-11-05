import WebSocket, { Server as WSServer } from "ws"
import Singleton from "./singleton"
import isPipUUID from "../utils/type-checks"
import BrowserSocketManager from "./browser-socket-manager"

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
			console.info(`ESP32 connected: ${socketId}`)

			ws.once("message", (message) => {
				const pipUUID = message.toString() // Treat the first message as the UUID
				if (!isPipUUID(pipUUID)) return
				this.addConnection(socketId, pipUUID)
				console.info(`Registered new ESP32 connection with UUID: ${pipUUID}`)
			})

			ws.on("close", () => this.handleDisconnection(socketId))
			ws.on("message", (message) => this.handleMessage(socketId, message.toString()))
		})
	}

	private handleMessage(clientId: string, message: string): void {
		console.info(`Message from ESP32 (${clientId}):`, message)
	}

	private addConnection(socketId: string, pipUUID: PipUUID): void {
		this.connections.set(socketId, { pipUUID, status: "connected"})
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "online")
	}

	private handleDisconnection(socketId: string): void {
		const socketInfo = this.connections.get(socketId)
		if (!socketInfo) return
		BrowserSocketManager.getInstance().emitPipStatusUpdate(socketInfo.pipUUID, "inactive")
		this.connections.delete(socketId)
	}

	public getPreviouslyConnectedPipUUIDs(userPipUUIDs: PipUUID[]): PreviouslyConnectedPipUUIDs[] {
		return userPipUUIDs.map((pipUUID) => {
			const connectionInfo = Array.from(this.connections.values()).find(
				(connection) => connection.pipUUID === pipUUID
			)

			let status: PipBrowserConnectionStatus = "inactive"

			if (connectionInfo) {
				switch (connectionInfo.status) {
				case "inactive":
					status = "inactive"
					break
				case "updating firmware":
					status = "online"
					break
				case "connected":
					status = "connected to other user"
					break
				}
			}

			return { pipUUID, status }
		})
	}

	public isPipUUIDConnected(pipUUID: PipUUID): boolean {
		for (const connectionInfo of this.connections.values()) {
			if (connectionInfo.pipUUID === pipUUID && connectionInfo.status === "connected") {
				return true // Return true as soon as we find a match
			}
		}
		return false // Return false if no match is found
	}

	public getESPStatus(pipUUID: PipUUID): ESPConnectionStatus {
		// Iterate through connections to find the one with the specified userId
		for (const connectionInfo of this.connections.values()) {
		  if (connectionInfo.pipUUID === pipUUID) {
				return connectionInfo.status
		  }
		}
		// Return "inactive" if no matching pipUUID was found
		return "inactive"
	}
}
