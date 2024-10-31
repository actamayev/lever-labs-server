import _ from "lodash"
import { Server as SocketIOServer, Socket } from "socket.io"
import Singleton from "./singleton"

export default class BrowserSocketManager extends Singleton {
	private connections = new Map<string, BrowserSocketConnectionInfo>() // Maps UserId to BrowserSocketConnectionInfo

	private constructor(private readonly io: SocketIOServer) {
		super()
		this.initializeListeners()
	}

	public static getInstance(io?: SocketIOServer): BrowserSocketManager {
		if (!BrowserSocketManager.instance) {
			if (!io) {
				throw new Error("SocketIOServer instance required to initialize BrowserSocketManager")
			}
			BrowserSocketManager.instance = new BrowserSocketManager(io)
		}
		return BrowserSocketManager.instance
	}

	private initializeListeners(): void {
		this.io.on("connection", (socket: Socket) => {
			this.handleBrowserConnection(socket)
		})
	}

	private handleBrowserConnection(socket: Socket): void {
		if (_.isUndefined(socket.userId)) {
			console.error(`User ${socket.id} is not authenticated`)
			return
		}
		this.addConnection(socket.userId.toString(), { socketId: socket.id, status: "connected" })
		socket.on("disconnect", () => this.handleDisconnection(socket.id))
	}

	private addConnection(id: string, info: BrowserSocketConnectionInfo): void {
		this.connections.set(id, info)
	}

	private handleDisconnection(id: string): void {
		if (!this.connections.has(id)) return
		this.connections.delete(id)
		console.log(`Disconnected: ${id}`)
	}

	private emitPipStatusUpdate(pipUUID: string, newConnectionStatus: string): void {
		// TODO: Figure out who to send to
		this.io.emit("pip-connection-status-update", { pipUUID, newConnectionStatus }) // Sends to all connected clients
	}
}
