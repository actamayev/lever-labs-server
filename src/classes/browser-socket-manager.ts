import isUndefined from "lodash/isUndefined"
import { Server as SocketIOServer, Socket } from "socket.io"
import Singleton from "./singleton"
import Esp32SocketManager from "./esp32/esp32-socket-manager"
import SendEsp32MessageManager from "./esp32/send-esp32-message-manager"
import retrieveUserPipUUIDs from "../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids"

export default class BrowserSocketManager extends Singleton {
	private connections = new Map<number, BrowserSocketConnectionInfo>() // Maps UserID to BrowserSocketConnectionInfo

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
			this.setupMotorControlListener(socket)
			this.setupNewLedColorListener(socket)
		})
	}

	private async handleBrowserConnection(socket: Socket): Promise<void> {
		if (isUndefined(socket.userId)) {
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

	private setupMotorControlListener(socket: Socket): void {
		socket.on("motor-control", async (motorControlData: IncomingMotorControlData) => {
			try {
				await SendEsp32MessageManager.getInstance().transferMotorControlData(motorControlData)
			} catch (error) {
				console.error("Motor control error:", error)
			}
		})
	}

	private setupNewLedColorListener(socket: Socket): void {
		socket.on("new-led-colors", async (ledControlData: IncomingNewLedControlData) => {
			try {
				await SendEsp32MessageManager.getInstance().transferLedControlData(ledControlData)
			} catch (error) {
				console.error("New LED Colors Error:", error)
			}
		})
	}

	private addConnection(userId: number, info: BrowserSocketConnectionInfo): void {
		this.connections.set(userId, info)
	}

	private handleDisconnection(userId: number | undefined): void {
		try {
			if (isUndefined(userId) || !this.connections.has(userId)) return
			const previouslyConnectedPipUUIDs = this.connections.get(userId)?.previouslyConnectedPipUUIDs

			if (!isUndefined(previouslyConnectedPipUUIDs)) {
				previouslyConnectedPipUUIDs.forEach((previousConnection) => {
					if (previousConnection.status === "connected" || previousConnection.status === "online") {
						void SendEsp32MessageManager.getInstance().stopCurrentlyRunningSandboxCode(previousConnection.pipUUID)
						if (previousConnection.status === "connected") {
							this.emitPipStatusUpdate(previousConnection.pipUUID, "online")
						}
					}
				})
			}
			this.connections.delete(userId)
		} catch (error) {
			console.error("Error during disconnection:", error)
		}
	}

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

	public addPipStatusToAccount(
		userId: number,
		pipUUID: PipUUID,
		status: PipBrowserConnectionStatus
	): void {
		try {
			const connectionInfo = this.connections.get(userId)

			if (!connectionInfo) {
				console.warn(`No connection found for userId: ${userId}`)
				return
			}

			// Get or add the pipUUID entry for this user and update its status
			const pipToUpdate = this.getOrAddPipEntry(connectionInfo.previouslyConnectedPipUUIDs, pipUUID, status)

			// Emit the updated status to the specified user and other users if necessary
			this.emitPipStatusForUser(pipUUID, userId, pipToUpdate.status)
			this.emitConnectionToPipToOtherUsers(pipUUID, userId, pipToUpdate.status) // The status won't always be "connected"
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	// Helper function to get or add a pipUUID entry for a user
	private getOrAddPipEntry(
		previouslyConnectedPipUUIDs: PreviouslyConnectedPipUUIDs[],
		pipUUID: PipUUID,
		status: PipBrowserConnectionStatus
	): PreviouslyConnectedPipUUIDs {
		let pipEntry = previouslyConnectedPipUUIDs.find(
			(previousPip) => previousPip.pipUUID === pipUUID
		)

		if (!pipEntry) {
			// If pipUUID entry doesn't exist, add it
			pipEntry = { pipUUID, status }
			previouslyConnectedPipUUIDs.push(pipEntry)
		} else {
			// Update the status of the existing pipUUID entry
			pipEntry.status = status
		}

		return pipEntry
	}

	// Helper function to emit pip status to the specified user
	private emitPipStatusForUser(
		pipUUID: PipUUID,
		userId: number,
		status: PipBrowserConnectionStatus
	): void {
		const connectionInfo = this.connections.get(userId)
		if (isUndefined(connectionInfo)) return
		this.io.to(connectionInfo.socketId).emit("pip-connection-status-update", {
			pipUUID,
			newConnectionStatus: status
		})
	}

	// Emit to other users connected to the same pipUUID
	private emitConnectionToPipToOtherUsers(
		pipUUID: PipUUID,
		userId: number,
		newStatus: PipBrowserConnectionStatus
	): void {
		for (const [otherUserId, otherConnectionInfo] of this.connections.entries()) {
			if (otherUserId === userId) continue

			const pipToUpdate = otherConnectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID
			)

			if (pipToUpdate) {
				// If the user's new status is connected, he has to notify others that their status is now "connected to other user"
				if (newStatus === "connected") {
					pipToUpdate.status = "connected to other user"
				} else if (newStatus === "online") {
					pipToUpdate.status = "online"
				}
				this.io.to(otherConnectionInfo.socketId).emit("pip-connection-status-update", {
					pipUUID,
					newConnectionStatus: pipToUpdate.status
				})
			}
		}
	}

	public whichUserConnectedToPipUUID(pipUUID: PipUUID): number | undefined {
		// Iterate through the Map entries (key-value pairs)
		for (const [userID, connectionInfo] of this.connections.entries()) {
			// Check if the specified pipUUID with status "connected" exists
			const foundConnection = connectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID && previousPip.status === "connected"
			)

			// If a match is found, return the key (userID)
			if (foundConnection) {
				return userID
			}
		}

		return undefined
	}

	private getLivePipStatuses(userId: number, pipUUIDs: PipUUID[]): PreviouslyConnectedPipUUIDs[] {
		return pipUUIDs.map((singlePipUUID) => ({
			pipUUID: singlePipUUID,
			status: this.getLivePipStatus(userId, singlePipUUID)
		}))
	}

	public getLivePipStatus(userId: number, pipUUID: PipUUID): PipBrowserConnectionStatus {
		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)

		// Check if the ESP32 is offline or updating firmware
		if (espStatus === "offline" || espStatus === "updating firmware") {
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

	public sendBrowserPipSensorData(pipUUID: PipUUID, sensorPayload: SensorPayload): void {
		this.connections.forEach((connectionInfo) => {
			// Check if the specified pipUUID exists in this connection's previouslyConnectedPipUUIDs
			const foundPip = connectionInfo.previouslyConnectedPipUUIDs.find(
				(pip) => pip.pipUUID === pipUUID
			)

			if (foundPip) {
				this.io.to(connectionInfo.socketId).emit("sensor-data", { pipUUID, sensorPayload })
			}
		})
	}
}
