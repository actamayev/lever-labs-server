import isUndefined from "lodash/isUndefined"
import { Server as SocketIOServer, Socket } from "socket.io"
import { StudentViewHubData } from "@bluedotrobots/common-ts/types/hub"
import { PipConnectionStatus, SensorPayload,
	BatteryMonitorData, SensorPayloadMZ } from "@bluedotrobots/common-ts/types/pip"
import { PipUUID, ClassCode } from "@bluedotrobots/common-ts/types/utils"
import { SocketEvents, SocketEventPayloadMap,
	StudentJoinedHub, DeletedHub, UpdatedHubSlideId, StudentLeftHub } from "@bluedotrobots/common-ts/types/socket"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import Singleton from "./singleton"
import listenersMap from "../utils/constants/listeners-map"
import Esp32SocketManager from "./esp32/esp32-socket-manager"
import SendEsp32MessageManager from "./esp32/send-esp32-message-manager"
import handleDisconnectHubHelper from "../utils/handle-disconnect-hub-helper"
import retrieveUsername from "../db-operations/read/credentials/retrieve-username"
import retrieveUserPipUUIDs from "../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids"

export default class BrowserSocketManager extends Singleton {
	private connections = new Map<number, BrowserSocketConnectionInfo>() // Maps UserID to BrowserSocketConnectionInfo

	private constructor(private readonly io: SocketIOServer) {
		super()
		this.initializeListeners()
	}

	public static override getInstance(io?: SocketIOServer): BrowserSocketManager {
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
			this.setupAllListeners(socket)
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

	private setupAllListeners(socket: Socket): void {
		Object.entries(listenersMap).forEach(([event, handler]) => {
			try {
				socket.on(event, handler)
			} catch (error) {
				console.error(`Error in ${event} listener:`, error)
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
						void SendEsp32MessageManager.getInstance().sendBinaryMessage(
							previousConnection.pipUUID,
							MessageBuilder.createStopSandboxCodeMessage()
						)
						if (previousConnection.status === "connected") {
							this.emitPipStatusUpdate(previousConnection.pipUUID, "online")
						}
					}
				})
			}
			void handleDisconnectHubHelper(userId)
			this.connections.delete(userId)
		} catch (error) {
			console.error("Error during disconnection:", error)
		}
	}

	public emitPipStatusUpdate(pipUUID: PipUUID, newConnectionStatus: PipConnectionStatus): void {
		this.connections.forEach((connectionInfo) => {
			// Check if the specified pipUUID exists in this connection's previouslyConnectedPipUUIDs
			const pipToUpdate = connectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID
			)

			if (pipToUpdate) {
				pipToUpdate.status = newConnectionStatus
				// Emit event to this specific connection
				this.emitToSocket(connectionInfo.socketId, "pip-connection-status-update", { pipUUID, newConnectionStatus })
			}
		})
	}

	public emitPipBatteryData(pipUUID: PipUUID, batteryData: BatteryMonitorData): void {
		this.connections.forEach((connectionInfo) => {
			const pipToUpdate = connectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID
			)

			if (pipToUpdate) {
				this.emitToSocket(connectionInfo.socketId, "battery-monitor-data", { pipUUID, batteryData })
			}
		})
	}

	public emitPipDinoScore(pipUUID: PipUUID, score: number): void {
		this.connections.forEach((connectionInfo) => {
			const pipToUpdate = connectionInfo.previouslyConnectedPipUUIDs.find(
				(previousPip) => previousPip.pipUUID === pipUUID
			)
			if (pipToUpdate) {
				this.emitToSocket(connectionInfo.socketId, "dino-score-update", { pipUUID, score })
			}
		})
	}

	public addPipStatusToAccount(
		userId: number,
		pipUUID: PipUUID,
		status: PipConnectionStatus
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
		status: PipConnectionStatus
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
		status: PipConnectionStatus
	): void {
		const connectionInfo = this.connections.get(userId)
		if (isUndefined(connectionInfo)) return
		this.emitToSocket(connectionInfo.socketId, "pip-connection-status-update", {
			pipUUID,
			newConnectionStatus: status
		})
	}

	// Emit to other users connected to the same pipUUID
	private emitConnectionToPipToOtherUsers(
		pipUUID: PipUUID,
		userId: number,
		newStatus: PipConnectionStatus
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
				this.emitToSocket(otherConnectionInfo.socketId, "pip-connection-status-update", {
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
		}) satisfies PreviouslyConnectedPipUUIDs)
	}

	public getLivePipStatus(userId: number, pipUUID: PipUUID): PipConnectionStatus {
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
			const foundPip = connectionInfo.previouslyConnectedPipUUIDs.find(
				(pip) => pip.pipUUID === pipUUID
			)

			if (foundPip) {
				this.emitToSocket(connectionInfo.socketId, "general-sensor-data", sensorPayload)
			}
		})
	}

	// TODO: Create re-usable method for sending this type of data (see sendBrowserPipSensorData, sendBrowserPipSensorDataMZ)
	public sendBrowserPipSensorDataMZ(pipUUID: PipUUID, sensorPayload: SensorPayloadMZ): void {
		this.connections.forEach((connectionInfo) => {
			const foundPip = connectionInfo.previouslyConnectedPipUUIDs.find(
				(pip) => pip.pipUUID === pipUUID
			)
			if (foundPip) {
				this.emitToSocket(connectionInfo.socketId, "general-sensor-data-mz", sensorPayload)
			}
		})
	}

	public async emitStudentJoinedClassroom(teacherUserId: number, classCode: ClassCode, studentUserId: number): Promise<void> {
		// 1. See if any of the teachers are connected. If none of them are connected, return. if at least one is connected, continue.
		// For each that is connected, emit the event to the teacher.
		const socketId = this.connections.get(teacherUserId)?.socketId
		if (isUndefined(socketId)) return
		const studentUsername = await retrieveUsername(studentUserId)
		if (isUndefined(socketId)) return
		this.emitToSocket(socketId, "student-joined-classroom", { classCode, studentUsername: studentUsername || "" })
	}

	public emitStudentJoinedHub(teacherUserId: number, data: StudentJoinedHub): void {
		const socketId = this.connections.get(teacherUserId)?.socketId
		if (isUndefined(socketId)) return
		this.emitToSocket(socketId, "student-joined-hub", data)
	}

	public emitNewHubToStudents(studentIds: number[], hubInfo: StudentViewHubData): void {
		studentIds.forEach(studentId => {
			this.emitToUser(studentId, "new-hub", hubInfo)
		})
	}

	public emitDeletedHubToStudents(studentIds: number[], deletedHubInfo: DeletedHub): void {
		studentIds.forEach(studentId => {
			this.emitToUser(studentId, "deleted-hub", deletedHubInfo)
		})
	}

	public emitUpdatedHubToStudents(studentIds: number[], updatedHubInfo: UpdatedHubSlideId): void {
		studentIds.forEach(studentId => {
			this.emitToUser(studentId, "updated-hub-slide-id", updatedHubInfo)
		})
	}

	public emitStudentLeftHub(teacherUserId: number, data: StudentLeftHub): void {
		const socketId = this.connections.get(teacherUserId)?.socketId
		if (isUndefined(socketId)) return
		this.emitToSocket(socketId, "student-left-hub", data)
	}

	public emitToUser<E extends SocketEvents>(
		userId: number,
		event: E,
		payload: SocketEventPayloadMap[E]
	): void {
		const connectionInfo = this.connections.get(userId)
		if (!connectionInfo) return
		this.emitToSocket(connectionInfo.socketId, event, payload)
	}

	private emitToSocket<E extends SocketEvents>(
		socketId: string,
		event: E,
		payload: SocketEventPayloadMap[E]
	): void {
		this.io.to(socketId).emit(event, payload)
	}
}
