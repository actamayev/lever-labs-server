import _ from "lodash"
import { Server as SocketIOServer, Socket } from "socket.io"
import Singleton from "./singleton"
import Esp32SocketManager from "./esp32-socket-manager"
import retrieveUserPipUUIDs from "../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids"

// TODO: Delete unused methods in this class and in ESP32 class
export default class BrowserSocketManager extends Singleton {
	private connections = new Map<number, BrowserSocketConnectionInfo>() // Maps SocketID to BrowserSocketConnectionInfo

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
			console.error(`User ${socket.userId} is not authenticated`)
			return
		}
		const userPipUUIDs = await retrieveUserPipUUIDs(socket.userId)
		this.addConnection(socket.userId, {
			socketId: socket.id,
			previouslyConnectedPipUUIDs: this.getLivePipStatuses(socket.userId, userPipUUIDs)
		})
		socket.on("disconnect", () => this.handleDisconnection(socket.userId))
	}

	private addConnection(userId: number, info: BrowserSocketConnectionInfo): void {
		this.connections.set(userId, info)
	}

	private handleDisconnection(userId: number | undefined): void {
		if (_.isUndefined(userId) || !this.connections.has(userId)) return
		const previouslyConnectedPipUUIDs = this.connections.get(userId)?.previouslyConnectedPipUUIDs

		if (!_.isUndefined(previouslyConnectedPipUUIDs)) {
			previouslyConnectedPipUUIDs.forEach((previousConnection) => {
				if (previousConnection.status === "connected") {
					// Esp32SocketManager.getInstance().handleClientLogoff(previousConnection.pipUUID)
					this.emitPipStatusUpdate(previousConnection.pipUUID, "online")
					// previousConnection.status = "online"
				}
			})
		}
		this.connections.delete(userId)
	}

	// public newPipUUIDOnline(pipUUID: PipUUID): void {
	// 	this.connections.forEach((connectionInfo) => {
	// 		const matchingPip = connectionInfo.previouslyConnectedPipUUIDs.find(
	// 			(pip) => pip.pipUUID === pipUUID
	// 		)
	// 		if (matchingPip) matchingPip.status = "online"
	// 	})
	// }

	public emitPipStatusUpdate(pipUUID: PipUUID, newConnectionStatus: PipBrowserConnectionStatus): void {
		this.connections.forEach((connectionInfo) => {
			// Check if the specified pipUUID exists in this connection's previouslyConnectedPipUUIDs
			const pipToUpdate = connectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID
			)

			if (pipToUpdate) {
				pipToUpdate.status = newConnectionStatus
				// Emit event to this specific connection
				this.io.to(connectionInfo.socketId).emit("pip-connection-status-update", { pipUUID, newConnectionStatus })
			}
		})
	}

	public emitPipStatusUpdateForUser(pipUUID: PipUUID, userId: number): void {
		this.connections.forEach((connectionInfo, connectionUserId) => {
		// Find the pipUUID in the connection's previouslyConnectedPipUUIDs
			const pipToUpdate = connectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID
			)

			if (!pipToUpdate) return

			// Set status based on whether the userId matches
			pipToUpdate.status = connectionUserId === userId ? "connected" : "connected to other user"

			// Emit event to this specific connection
			this.io.to(connectionInfo.socketId).emit("pip-connection-status-update", {
				pipUUID,
				newConnectionStatus: pipToUpdate.status
			})
		})
	}

	public isUUIDConnected(pipUUID: PipUUID): boolean {
		// Iterate through each connection in the connections map
		for (const connectionInfo of this.connections.values()) {
			// Check if any previouslyConnectedPipUUIDs has the specified pipUUID with status "connected"
			const isConnected = connectionInfo.previouslyConnectedPipUUIDs.some(
				(previousPip) => previousPip.pipUUID === pipUUID && previousPip.status === "connected"
			)

			// If a match is found, return true
			if (isConnected) return true
		}

		// If no matches were found, return false
		return false
	}

	private getLivePipStatuses(userId: number, pipUUIDs: PipUUID[]): PreviouslyConnectedPipUUIDs[] {
		return pipUUIDs.map((singlePipUUID) => ({
			pipUUID: singlePipUUID,
			status: this.getLivePipStatus(userId, singlePipUUID)
		}))
	}

	public getLivePipStatus(userId: number, pipUUID: PipUUID): PipBrowserConnectionStatus {
		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)

		// Check if the ESP32 is inactive or updating firmware
		if (espStatus === "inactive" || espStatus === "updating firmware") {
			return espStatus
		}

		// Iterate over connections to find the relevant pipUUID
		for (const [connectionUserId, connectionInfo] of this.connections.entries()) {

			// Check if this connection belongs to the given user
			if (connectionUserId === userId) {
				const pipInfo = connectionInfo.previouslyConnectedPipUUIDs.find(
					(previousPip) => previousPip.pipUUID === pipUUID
				)

				// If found, return its status
				if (pipInfo) return pipInfo.status
			} else {
				const pipInfo = connectionInfo.previouslyConnectedPipUUIDs.find(
					(previousPip) => previousPip.pipUUID === pipUUID
				)

				// If found and status is "connected", return "connected to other user"
				if (pipInfo?.status === "connected") return "connected to other user"
			}
		}

		// Return "online" if no matching pipUUID or userId was found
		return "online"
	}

	public addOrUpdatePipStatus(userId: number, pipUUID: PipUUID, status: PipBrowserConnectionStatus): void {
		// Iterate through connections to find ones that match the specified userId
		this.connections.forEach((connectionInfo, connectionUserId) => {
			if (connectionUserId !== userId) return
			// Check if the pipUUID exists in previouslyConnectedPipUUIDs
			const existingPip = connectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID
			)

			if (existingPip) {
				existingPip.status = status
				return
			}
			connectionInfo.previouslyConnectedPipUUIDs.push({ pipUUID, status })
		})
	}
}
