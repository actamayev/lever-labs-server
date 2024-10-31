import _ from "lodash"
import { Server as SocketIOServer, Socket } from "socket.io"
import Singleton from "./singleton"

export default class BrowserSocketManager extends Singleton {
	private _userConnections: Map<number, SocketConnectionInfo> = new Map<number, SocketConnectionInfo>()

	constructor(private readonly io: SocketIOServer) {
		super()
		this.initializeListeners()
	}

	get userConnections(): Map<number, SocketConnectionInfo> {
		return this._userConnections
	}

	set userConnections(value: Map<number, SocketConnectionInfo>) {
		this._userConnections = value
	}

	public static assignIo(io: SocketIOServer): void {
		if (_.isNull(BrowserSocketManager.instance)) {
			BrowserSocketManager.instance = new BrowserSocketManager(io)
		} else {
			throw new Error("BrowserSocketManager instance has already been initialized")
		}
	}

	public static getInstance(): BrowserSocketManager {
		if (_.isNull(BrowserSocketManager.instance)) {
			throw new Error("BrowserSocketManager instance is not initialized. Call assignIo first.")
		}
		return BrowserSocketManager.instance
	}

	private initializeListeners(): void {
		// This connection socket endpoint is hit whenever the user logs in or opens the app
		this.io.on("connection", (socket: Socket) => {
			this.handleConnection(socket)
		})
	}

	// This is called whenever a user connects to socket io (from the this._io.on("connection") listener)
	private handleConnection(socket: Socket): void {
		if (_.isUndefined(socket.userId)) {
			console.error(`User ${socket.id} is not authenticated`)
			return
		}
		this.handleEstablishConnection(socket.userId, socket)
		socket.on("disconnect", () => this.handleDisconnect(socket))
	}

	private handleEstablishConnection(userId: number, socket: Socket): void {
		this.userConnections.set(userId, { socketId: socket.id, status: "active" })
		this.io.to(userId.toString()).emit("connected")
	}

	public updatePipConnectionStatus(toUserId: number, newConnectionStatus: PipConnectionStatus): void {
		const receiverSocketId = this.userConnections.get(toUserId)?.socketId
		if (_.isUndefined(receiverSocketId)) return
		this.io.to(receiverSocketId).emit(
			"update-pip-connection-status", {
				newConnectionStatus
			}
		)
	}

	private handleDisconnect(socket: Socket): void {
		const userId = socket.userId
		if (userId && this.userConnections.has(userId)) {
			this.userConnections.delete(userId)
		}
	}
}
