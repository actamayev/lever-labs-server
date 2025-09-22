import isUndefined from "lodash/isUndefined"
import { isNull } from "lodash"
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
import autoConnectToLastOnlineUser from "../utils/pip/auto-connect-to-last-online-user"

type BrowserSocketConnectionInfo = {
	socketId: string
	currentlyConnectedPipUUID: PipUUID | null
}

export default class BrowserSocketManager extends Singleton {
	private connections = new Map<number, BrowserSocketConnectionInfo>() // userId -> connection info

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

	public getConnectionInfo(userId: number): BrowserSocketConnectionInfo | undefined {
		return this.connections.get(userId)
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
			currentlyConnectedPipUUID: null
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
			if (isUndefined(userId)) return
			const connectionInfo = this.getConnectionInfo(userId)
			if (isUndefined(connectionInfo)) return
			const currentlyConnectedPipUUID = connectionInfo.currentlyConnectedPipUUID

			if (!isNull(currentlyConnectedPipUUID)) {
				const espStatus = Esp32SocketManager.getInstance().getESPStatus(currentlyConnectedPipUUID)
				if (isUndefined(espStatus)) return
				if (espStatus.connectedToSerialUserId === userId) {
					Esp32SocketManager.getInstance().handleSerialDisconnect(currentlyConnectedPipUUID)
				}
				if (espStatus.connectedToOnlineUserId === userId) {
					void SendEsp32MessageManager.getInstance().sendBinaryMessage(
						currentlyConnectedPipUUID,
						MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.NOT_CONNECTED)
					)
					Esp32SocketManager.getInstance().setOnlineUserDisconnected(currentlyConnectedPipUUID, false)
				}
				autoConnectToLastOnlineUser(currentlyConnectedPipUUID, userId)
			}
			void handleDisconnectHubHelper(userId)
			this.connections.delete(userId)
		} catch (error) {
			console.error("Error during disconnection:", error)
		}
	}

	public emitPipStatusUpdateToUser(userId: number, pipUUID: PipUUID, newConnectionStatus: ClientPipConnectionStatus): void {
		const connectionInfo = this.getConnectionInfo(userId)
		if (isUndefined(connectionInfo)) return
		if (connectionInfo.currentlyConnectedPipUUID !== pipUUID) return
		this.emitToSocket(connectionInfo.socketId, "pip-connection-status-update", { pipUUID, newConnectionStatus })
	}

	public removePipConnection(userId: number, pipUUID: PipUUID): void {
		const connectionInfo = this.getConnectionInfo(userId)
		if (isUndefined(connectionInfo)) return
		if (connectionInfo.currentlyConnectedPipUUID !== pipUUID) return
		this.connections.set(userId, {
			...connectionInfo,
			currentlyConnectedPipUUID: null
		})
	}

	public emitPipBatteryData(pipUUID: PipUUID, batteryData: BatteryMonitorData): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPipUUID)) return
			const pipToUpdate = connectionInfo.currentlyConnectedPipUUID === pipUUID

			if (!pipToUpdate) return
			this.emitToSocket(connectionInfo.socketId, "battery-monitor-data", { pipUUID, batteryData })
		})
	}

	public emitPipDinoScore(pipUUID: PipUUID, score: number): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPipUUID)) return
			const pipToUpdate = connectionInfo.currentlyConnectedPipUUID === pipUUID
			if (!pipToUpdate) return
			this.emitToSocket(connectionInfo.socketId, "dino-score-update", { pipUUID, score })
		})
	}

	public sendBrowserPipSensorData(pipUUID: PipUUID, sensorPayload: SensorPayload): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPipUUID)) return
			const foundPip = connectionInfo.currentlyConnectedPipUUID === pipUUID
			if (!foundPip) return
			this.emitToSocket(connectionInfo.socketId, "general-sensor-data", sensorPayload)
		})
	}

	// TODO: Create re-usable method for sending this type of data (see sendBrowserPipSensorData, sendBrowserPipSensorDataMZ)
	public sendBrowserPipSensorDataMZ(pipUUID: PipUUID, sensorPayload: SensorPayloadMZ): void {
		this.connections.forEach((connectionInfo) => {
			if (isNull(connectionInfo.currentlyConnectedPipUUID)) return
			const foundPip = connectionInfo.currentlyConnectedPipUUID === pipUUID
			if (!foundPip) return
			this.emitToSocket(connectionInfo.socketId, "general-sensor-data-mz", sensorPayload)
		})
	}

	public async emitStudentJoinedClassroom(teacherUserId: number, classCode: ClassCode, studentUserId: number): Promise<void> {
		// 1. See if any of the teachers are connected. If none of them are connected, return. if at least one is connected, continue.
		// For each that is connected, emit the event to the teacher.
		const socketId = this.getConnectionInfo(teacherUserId)?.socketId
		if (isUndefined(socketId)) return
		const studentUsername = await retrieveUsername(studentUserId)
		if (isUndefined(socketId)) return
		this.emitToSocket(socketId, "student-joined-classroom", {
			classCode, studentUsername: studentUsername || "", studentId: studentUserId })
	}

	public emitStudentJoinedHub(teacherUserId: number, data: StudentJoinedHub): void {
		const socketId = this.getConnectionInfo(teacherUserId)?.socketId
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
		const socketId = this.getConnectionInfo(teacherUserId)?.socketId
		if (isUndefined(socketId)) return
		this.emitToSocket(socketId, "student-left-hub", data)
	}

	public emitToUser<E extends SocketEvents>(
		userId: number,
		event: E,
		payload: SocketEventPayloadMap[E]
	): void {
		const connectionInfo = this.getConnectionInfo(userId)
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
	public disconnectOnlineUserFromPip(pipUUID: PipUUID, onlineConnectedUserId: number): void {
		const connectionInfo = this.getConnectionInfo(onlineConnectedUserId)
		if (
			isUndefined(connectionInfo) ||
			connectionInfo.currentlyConnectedPipUUID !== pipUUID
		) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.NOT_CONNECTED)
		)

		// Emit status update to the browser
		this.emitPipStatusUpdateToUser(onlineConnectedUserId, pipUUID, "connected to serial to another user")
	}

	public updateCurrentlyConnectedPip(userId: number, pipUUID: PipUUID | null): void {
		const connectionInfo = this.getConnectionInfo(userId)
		if (isUndefined(connectionInfo)) return
		this.connections.set(userId, {
			...connectionInfo,
			currentlyConnectedPipUUID: pipUUID
		})
	}
}
