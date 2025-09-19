import isUndefined from "lodash/isUndefined"
import { isNil, isNull } from "lodash"
import { Server as SocketIOServer, Socket } from "socket.io"
import { StudentViewHubData } from "@bluedotrobots/common-ts/types/hub"
import { SensorPayload, ClientPipConnectionStatus,
	BatteryMonitorData, SensorPayloadMZ } from "@bluedotrobots/common-ts/types/pip"
import { PipUUID, ClassCode } from "@bluedotrobots/common-ts/types/utils"
import { SocketEvents, SocketEventPayloadMap,
	StudentJoinedHub, DeletedHub, UpdatedHubSlideId, StudentLeftHub } from "@bluedotrobots/common-ts/types/socket"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import Singleton from "./singleton"
import listenersMap from "../utils/constants/listeners-map"
import SendEsp32MessageManager from "./esp32/send-esp32-message-manager"
import handleDisconnectHubHelper from "../utils/handle-disconnect-hub-helper"
import retrieveUsername from "../db-operations/read/credentials/retrieve-username"
import { UserConnectedStatus } from "@bluedotrobots/common-ts/protocol"
import Esp32SocketManager from "./esp32/esp32-socket-manager"

export default class BrowserSocketManager extends Singleton {
	private connections = new Map<number, BrowserSocketConnectionInfo>()

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
		this.io.on("connection", (socket: Socket) => {
			this.handleBrowserConnection(socket)
			this.setupAllListeners(socket)
		})
	}

	private handleBrowserConnection(socket: Socket): void {
		if (isUndefined(socket.userId)) {
			console.error(`User ${socket.userId} is not authenticated`)
			return
		}
		this.addConnection(socket.userId, {
			socketId: socket.id,
			currentlyConnectedPip: null
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

	// eslint-disable-next-line complexity
	private handleDisconnection(userId: number | undefined): void {
		try {
			if (isUndefined(userId) || !this.connections.has(userId)) return
			const currentlyConnectedPip = this.connections.get(userId)?.currentlyConnectedPip
			console.log("currentlyConnectedPip", currentlyConnectedPip)

			if (!isNil(currentlyConnectedPip)) {
				if (currentlyConnectedPip.status.connectedToOnlineUser || currentlyConnectedPip.status.online) {
					void SendEsp32MessageManager.getInstance().sendBinaryMessage(
						currentlyConnectedPip.pipUUID,
						MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.NOT_CONNECTED)
					)
					// eslint-disable-next-line max-depth
					if (currentlyConnectedPip.status.connectedToOnlineUser) {
						const updatedStatus: ESPConnectionState = {
							...currentlyConnectedPip.status,
							connectedToOnlineUser: false
						}
						currentlyConnectedPip.status = updatedStatus
						this.emitPipStatusUpdate(currentlyConnectedPip.pipUUID, updatedStatus)
						Esp32SocketManager.getInstance().setUserConnection(currentlyConnectedPip.pipUUID, false)
					}
				} else if (currentlyConnectedPip.status.connectedToSerial) {
					const updatedStatus: ESPConnectionState = {
						...currentlyConnectedPip.status,
						connectedToSerial: false
					}
					currentlyConnectedPip.status = updatedStatus
					this.emitPipStatusUpdate(currentlyConnectedPip.pipUUID, updatedStatus)
				}
			}
			void handleDisconnectHubHelper(userId)
			this.connections.delete(userId)
		} catch (error) {
			console.error("Error during disconnection:", error)
		}
	}

	public emitPipStatusUpdate(pipUUID: PipUUID, newConnectionStatus: ESPConnectionState): void {
		this.connections.forEach((connectionInfo, userId) => {
			// Check if the specified pipUUID exists in this connection's currentlyConnectedPip
			if (isNil(connectionInfo.currentlyConnectedPip)) return
			const pipToUpdate = connectionInfo.currentlyConnectedPip.pipUUID === pipUUID

			if (!pipToUpdate) return
			connectionInfo.currentlyConnectedPip.status = newConnectionStatus
			// Emit event to this specific connection using user-relative client status
			const clientStatus = this.toClientStatus(newConnectionStatus, userId, pipUUID)
			this.emitToSocket(connectionInfo.socketId, "pip-connection-status-update", { pipUUID, newConnectionStatus: clientStatus })
		})
	}

	public emitPipBatteryData(pipUUID: PipUUID, batteryData: BatteryMonitorData): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPip)) return
			const pipToUpdate = connectionInfo.currentlyConnectedPip.pipUUID === pipUUID

			if (pipToUpdate) {
				this.emitToSocket(connectionInfo.socketId, "battery-monitor-data", { pipUUID, batteryData })
			}
		})
	}

	public emitPipDinoScore(pipUUID: PipUUID, score: number): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPip)) return
			const pipToUpdate = connectionInfo.currentlyConnectedPip.pipUUID === pipUUID
			if (pipToUpdate) {
				this.emitToSocket(connectionInfo.socketId, "dino-score-update", { pipUUID, score })
			}
		})
	}

	public addPipStatusToAccount(
		userId: number,
		pipUUID: PipUUID,
		status: ESPConnectionState
	): boolean {
		try {
			const connectionInfo = this.connections.get(userId)

			if (!connectionInfo) {
				console.warn(`No connection found for userId: ${userId}`)
				return false
			}

			// Update the currentlyConnectedPip entry for this user
			connectionInfo.currentlyConnectedPip = { pipUUID, status }
			return true
		} catch (error) {
			console.error(error)
			return false
		}
	}

	public whichUserConnectedToPipUUID(pipUUID: PipUUID): number | undefined {
		for (const [userID, connectionInfo] of this.connections.entries()) {
			// Check if the specified pipUUID with status "connectedToOnlineUser" exists
			if (isNull(connectionInfo.currentlyConnectedPip)) continue
			const foundConnection =
		connectionInfo.currentlyConnectedPip.pipUUID === pipUUID &&
		connectionInfo.currentlyConnectedPip.status.connectedToOnlineUser

			// If a match is found, return the key (userID)
			if (foundConnection) {
				return userID
			}
		}

		return undefined
	}

	public sendBrowserPipSensorData(pipUUID: PipUUID, sensorPayload: SensorPayload): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPip)) return
			const foundPip = connectionInfo.currentlyConnectedPip.pipUUID === pipUUID
			if (foundPip) {
				this.emitToSocket(connectionInfo.socketId, "general-sensor-data", sensorPayload)
			}
		})
	}

	// TODO: Create re-usable method for sending this type of data (see sendBrowserPipSensorData, sendBrowserPipSensorDataMZ)
	public sendBrowserPipSensorDataMZ(pipUUID: PipUUID, sensorPayload: SensorPayloadMZ): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPip)) return
			const foundPip = connectionInfo.currentlyConnectedPip.pipUUID === pipUUID
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
		this.emitToSocket(socketId, "student-joined-classroom", {
			classCode, studentUsername: studentUsername || "", studentId: studentUserId })
	}

	public emitStudentJoinedHub(teacherUserId: number, data: StudentJoinedHub): void {
		const socketId = this.connections.get(teacherUserId)?.socketId
		if (isUndefined(socketId)) return
		this.emitToSocket(socketId, "student-joined-hub", data)
	}

	public emitNewHubToStudents(studentUserIds: number[], hubInfo: StudentViewHubData): void {
		studentUserIds.forEach(studentUserId => {
			this.emitToUser(studentUserId, "new-hub", hubInfo)
		})
	}

	public emitDeletedHubToStudents(studentUserIds: number[], deletedHubInfo: DeletedHub): void {
		studentUserIds.forEach(studentUserId => {
			this.emitToUser(studentUserId, "deleted-hub", deletedHubInfo)
		})
	}

	public emitUpdatedHubToStudents(studentUserIds: number[], updatedHubInfo: UpdatedHubSlideId): void {
		studentUserIds.forEach(studentUserId => {
			this.emitToUser(studentUserId, "updated-hub-slide-id", updatedHubInfo)
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

	public getIsUserConnectedToPip(userId: number, pipUUID: PipUUID): boolean {
		const connectionInfo = this.connections.get(userId)
		if (isUndefined(connectionInfo)) return false
		if (isNull(connectionInfo.currentlyConnectedPip)) return false
		return connectionInfo.currentlyConnectedPip.pipUUID === pipUUID && connectionInfo.currentlyConnectedPip.status.connectedToOnlineUser
	}

	public getCurrentlyConnectedPip(userId: number): CurrentlyConnectedPip | undefined {
		const connectionInfo = this.connections.get(userId)
		if (
			isUndefined(connectionInfo) ||
			isNull(connectionInfo.currentlyConnectedPip)
		) return undefined
		return connectionInfo.currentlyConnectedPip
	}

	public emitGarageDrivingStatusUpdateToStudents(studentUserIds: number[], garageDrivingStatus: boolean): void {
		studentUserIds.forEach(studentUserId => {
			this.emitToUser(studentUserId, "garage-driving-status-update", { garageDrivingStatus })
		})
	}

	public emitGarageSoundsStatusUpdateToStudents(studentUserIds: number[], garageSoundsStatus: boolean): void {
		studentUserIds.forEach(studentUserId => {
			this.emitToUser(studentUserId, "garage-sounds-status-update", { garageSoundsStatus })
		})
	}

	public emitGarageLightsStatusUpdateToStudents(studentUserIds: number[], garageLightsStatus: boolean): void {
		studentUserIds.forEach(studentUserId => {
			this.emitToUser(studentUserId, "garage-lights-status-update", { garageLightsStatus })
		})
	}

	public emitGarageDisplayStatusUpdateToStudents(studentUserIds: number[], garageDisplayStatus: boolean): void {
		studentUserIds.forEach(studentUserId => {
			this.emitToUser(studentUserId, "garage-display-status-update", { garageDisplayStatus })
		})
	}

	// Method to disconnect user from PIP when serial connection takes priority
	public disconnectUserFromPip(pipUUID: PipUUID): void {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [userId, connectionInfo] of this.connections.entries()) {
			if (connectionInfo.currentlyConnectedPip?.pipUUID === pipUUID &&
				connectionInfo.currentlyConnectedPip.status.connectedToOnlineUser) {

				// Update the connection status to remove user connection
				const updatedStatus: ESPConnectionState = {
					...connectionInfo.currentlyConnectedPip.status,
					connectedToOnlineUser: false
				}
				connectionInfo.currentlyConnectedPip.status = updatedStatus

				// Notify the ESP32 that user is no longer connected
				void SendEsp32MessageManager.getInstance().sendBinaryMessage(
					pipUUID,
					MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.NOT_CONNECTED)
				)

				// Emit status update to the browser
				this.emitPipStatusUpdate(pipUUID, updatedStatus)
				break
			}
		}
	}

	// Helper method to convert ESPConnectionState to user-relative ClientPipConnectionStatus
	private toClientStatus(status: ESPConnectionState, requestingUserId: number, pipUUID: PipUUID): ClientPipConnectionStatus {
		// Serial connection takes priority over everything
		if (status.connectedToSerial) return "connected to serial"

		// Check if offline
		if (!status.online) return "offline"

		// If someone is connected to this PIP, check if it's the requesting user
		if (status.connectedToOnlineUser) {
			const connectedUserId = this.whichUserConnectedToPipUUID(pipUUID)
			return connectedUserId === requestingUserId ? "connected to you" : "connected to another user"
		}

		// Just online, available for connection
		return "online"
	}
}
