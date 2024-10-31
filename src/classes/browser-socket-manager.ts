import _ from "lodash"
import { Server as SocketIOServer, Socket } from "socket.io"
import Singleton from "./singleton"
import Esp32SocketManager from "./esp32-socket-manager"
import retrieveUserPipUUIDs from "../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids"

export default class BrowserSocketManager extends Singleton {
	private connections = new Map<string, BrowserSocketConnectionInfo>() // Maps SocketID to BrowserSocketConnectionInfo

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
		this.io.on("connection", async (socket: Socket) => {
			await this.handleBrowserConnection(socket)
		})
	}

	private async handleBrowserConnection(socket: Socket): Promise<void> {
		if (_.isUndefined(socket.userId)) {
			console.error(`User ${socket.id} is not authenticated`)
			return
		}
		const userPipUUIDs = await retrieveUserPipUUIDs(socket.userId)
		this.addConnection(socket.id, {
			userId: socket.userId,
			previouslyConnectedPipUUIDs: Esp32SocketManager.getInstance().getPreviouslyConnectedPipUUIDs(userPipUUIDs)
		})
		socket.on("disconnect", () => this.handleDisconnection(socket.id))
	}

	private addConnection(socketId: string, info: BrowserSocketConnectionInfo): void {
		this.connections.set(socketId, info)
	}

	private handleDisconnection(socketId: string): void {
		if (!this.connections.has(socketId)) return
		this.connections.delete(socketId)
	}

	public newPipUUIDOnline(pipUUID: PipUUID): void {
		this.connections.forEach((connectionInfo) => {
			const matchingPip = connectionInfo.previouslyConnectedPipUUIDs.find(
				(pip) => pip.pipUUID === pipUUID
			)
			if (matchingPip) matchingPip.status = "online"
		})
	}

	public emitPipStatusUpdate(pipUUID: PipUUID, newConnectionStatus: PipBrowserConnectionStatus): void {
		this.connections.forEach((connectionInfo, socketId) => {
			// Check if the specified pipUUID exists in this connection's previouslyConnectedPipUUIDs
			const hasPipUUID = connectionInfo.previouslyConnectedPipUUIDs.some(
				(previousPip) => previousPip.pipUUID === pipUUID
			)

			if (hasPipUUID) {
				// Emit event to this specific connection
				this.io.to(socketId).emit("pip-connection-status-update", { pipUUID, newConnectionStatus })
			}
		})
	}

	// TODO: Add Pip UUID to connection, remove it.
}
