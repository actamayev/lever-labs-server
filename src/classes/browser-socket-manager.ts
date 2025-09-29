/* eslint-disable max-depth */
import isUndefined from "lodash/isUndefined"
import { isNull } from "lodash"
import { Server as SocketIOServer, Socket } from "socket.io"
import { StudentViewHubData } from "@lever-labs/common-ts/types/hub"
import { SensorPayload, ClientPipConnectionStatus,
	BatteryMonitorData, SensorPayloadMZ } from "@lever-labs/common-ts/types/pip"
import { PipUUID, ClassCode } from "@lever-labs/common-ts/types/utils"
import { SocketEvents, SocketEventPayloadMap,
	StudentJoinedHub, DeletedHub, UpdatedHubSlideId, StudentLeftHub } from "@lever-labs/common-ts/types/socket"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import Singleton from "./singletons/singleton"
import listenersMap from "../utils/constants/listeners-map"
import SendEsp32MessageManager from "./esp32/send-esp32-message-manager"
import handleDisconnectHubHelper from "../utils/handle-disconnect-hub-helper"
import retrieveUsername from "../db-operations/read/credentials/retrieve-username"
import { UserConnectedStatus } from "@lever-labs/common-ts/protocol"
import Esp32SocketManager from "./esp32/esp32-socket-manager"
import espConnectionStateToClientConnectionStatus from "../utils/pip/esp-connection-state-to-client-connection-status"
import autoConnectToPip from "../utils/pip/auto-connect-to-pip"

type UserConnectionState = {
	sockets: Set<string>  // Set of unique socket IDs
	currentlyConnectedPipUUID: PipUUID | null
	lastActivityAt: Date
}

export default class BrowserSocketManager extends Singleton {
	private connections = new Map<number, UserConnectionState>() // userId -> user connection state

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

	public getUserConnectionState(userId: number): UserConnectionState | undefined {
		return this.connections.get(userId)
	}

	// Helper method to get current pip for user
	public getCurrentlyConnectedPipUUID(userId: number): PipUUID | null {
		const userState = this.connections.get(userId)
		return userState?.currentlyConnectedPipUUID || null
	}

	// Helper method to check if user has any active sockets
	public hasActiveSockets(userId: number): boolean {
		const userState = this.connections.get(userId)
		return (userState?.sockets.size || 0) > 0
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

		const userId = socket.userId
		const existingState = this.connections.get(userId)
		const isFirstSocket = !existingState || existingState.sockets.size === 0

		this.addSocketToUser(userId, socket.id)

		// Only attempt auto-connect if this is truly the first connection
		// and we don't already have a pip connection
		if (isFirstSocket && !existingState?.currentlyConnectedPipUUID) {
			// This is the first socket - attempt auto-connect
			autoConnectToPip(userId)
		}

		// If user already connected to a pip, emit current status to this new socket
		const userState = this.connections.get(userId)
		if (userState?.currentlyConnectedPipUUID) {
			const espStatus = Esp32SocketManager.getInstance().getESPStatus(userState.currentlyConnectedPipUUID)
			if (espStatus) {
				const connectionStatus = espConnectionStateToClientConnectionStatus(espStatus, userId)
				this.emitToSocket(socket.id, "pip-connection-status-update", {
					pipUUID: userState.currentlyConnectedPipUUID,
					newConnectionStatus: connectionStatus
				})
			}
		}

		socket.on("disconnect", () => this.handleDisconnection(userId, socket.id))
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

	private addSocketToUser(userId: number, socketId: string): void {
		const existingState = this.connections.get(userId)

		if (existingState) {
			// Add socket to existing user state
			existingState.sockets.add(socketId)
			existingState.lastActivityAt = new Date()
		} else {
			// Create new user state
			const newState: UserConnectionState = {
				sockets: new Set([socketId]),
				currentlyConnectedPipUUID: null,
				lastActivityAt: new Date()
			}
			this.connections.set(userId, newState)
		}
	}

	private handleDisconnection(userId: number, socketId: string): void {
		try {
			const userState = this.connections.get(userId)
			if (isUndefined(userState)) return

			// Remove this socket from user's socket list
			userState.sockets.delete(socketId)

			// If user still has other sockets open, just update activity and return
			if (userState.sockets.size > 0) {
				userState.lastActivityAt = new Date()
				return
			}

			// This was the last socket - proceed with full disconnection logic
			const currentlyConnectedPipUUID = userState.currentlyConnectedPipUUID

			if (!isNull(currentlyConnectedPipUUID)) {
				const espStatus = Esp32SocketManager.getInstance().getESPStatus(currentlyConnectedPipUUID)
				if (!isUndefined(espStatus)) {
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
				}
			}

			void handleDisconnectHubHelper(userId)
			// Remove user entirely since no sockets remain
			this.connections.delete(userId)
		} catch (error) {
			console.error("Error during disconnection:", error)
		}
	}

	public emitPipStatusUpdateToUser(userId: number, pipUUID: PipUUID, newConnectionStatus: ClientPipConnectionStatus): void {
		const userState = this.connections.get(userId)
		if (isUndefined(userState)) return
		if (userState.currentlyConnectedPipUUID !== pipUUID) return

		// Emit to ALL sockets for this user
		this.emitToAllUserStateSockets(userState, "pip-connection-status-update", { pipUUID, newConnectionStatus })
	}

	public updateCurrentlyConnectedPip(userId: number, pipUUID: PipUUID | null): void {
		let userState = this.connections.get(userId)

		if (isUndefined(userState)) {
			// Create a user state even if no sockets yet (e.g., during login auto-connect)
			userState = {
				sockets: new Set(),
				currentlyConnectedPipUUID: pipUUID,
				lastActivityAt: new Date()
			}
			this.connections.set(userId, userState)
			return
		}

		userState.currentlyConnectedPipUUID = pipUUID
		userState.lastActivityAt = new Date()

		// If connecting to a pip, emit status to all user's sockets
		if (!pipUUID) return
		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)
		if (!espStatus) return
		const connectionStatus = espConnectionStateToClientConnectionStatus(espStatus, userId)
		this.emitToAllUserStateSockets(userState, "pip-connection-status-update", {
			pipUUID,
			newConnectionStatus: connectionStatus
		})
	}

	public removePipConnection(userId: number): void {
		const userState = this.connections.get(userId)
		if (isUndefined(userState)) return

		const previousPipUUID = userState.currentlyConnectedPipUUID
		userState.currentlyConnectedPipUUID = null
		userState.lastActivityAt = new Date()

		// Emit disconnection status to all user's sockets
		if (!previousPipUUID) return
		this.emitToAllUserStateSockets(userState, "pip-connection-status-update", {
			pipUUID: previousPipUUID,
			newConnectionStatus: "offline"
		})
	}

	private emitDataToConnectedPipUsers<E extends SocketEvents>(
		pipUUID: PipUUID,
		event: E,
		payload: SocketEventPayloadMap[E]
	): void {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		this.connections.forEach((userState, _userId) => {
			if (userState.currentlyConnectedPipUUID !== pipUUID) return
			this.emitToAllUserStateSockets(userState, event, payload)
		})
	}

	public emitPipBatteryData(pipUUID: PipUUID, batteryData: BatteryMonitorData): void {
		// Find all users connected to this pip and emit to ALL their sockets
		this.emitDataToConnectedPipUsers(pipUUID, "battery-monitor-data", { pipUUID, batteryData })
	}

	public emitPipDinoScore(pipUUID: PipUUID, score: number): void {
		this.emitDataToConnectedPipUsers(pipUUID, "dino-score-update", { pipUUID, score })
	}

	public sendBrowserPipSensorData(pipUUID: PipUUID, sensorPayload: SensorPayload): void {
		this.emitDataToConnectedPipUsers(pipUUID, "general-sensor-data", sensorPayload)
	}

	public sendBrowserPipSensorDataMZ(pipUUID: PipUUID, sensorPayload: SensorPayloadMZ): void {
		this.emitDataToConnectedPipUsers(pipUUID, "general-sensor-data-mz", sensorPayload)
	}

	public async emitStudentJoinedClassroom(
		teacherUserId: number,
		classCode: ClassCode,
		studentUserId: number,
		studentId: number
	): Promise<void> {
		const userState = this.connections.get(teacherUserId)
		if (isUndefined(userState) || userState.sockets.size === 0) return

		const studentUsername = await retrieveUsername(studentUserId)
		if (isUndefined(studentUsername)) return

		// Emit to all teacher's sockets
		this.emitToAllUserStateSockets(userState, "student-joined-classroom", {
			classCode, studentUsername: studentUsername || "", studentId
		})
	}

	public emitStudentJoinedHub(teacherUserId: number, data: StudentJoinedHub): void {
		const userState = this.connections.get(teacherUserId)
		if (isUndefined(userState)) return

		this.emitToAllUserStateSockets(userState, "student-joined-hub", data)
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
		this.emitToUser(teacherUserId, "student-left-hub", data)
	}

	public emitToUser<E extends SocketEvents>(
		userId: number,
		event: E,
		payload: SocketEventPayloadMap[E]
	): void {
		const userState = this.connections.get(userId)
		if (!userState) return

		// Emit to ALL sockets for this user
		this.emitToAllUserStateSockets(userState, event, payload)
	}

	private emitToAllUserStateSockets<E extends SocketEvents>(
		userState: UserConnectionState,
		event: E,
		payload: SocketEventPayloadMap[E]
	): void {
		userState.sockets.forEach(socketId => {
			this.emitToSocket(socketId, event, payload)
		})
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

	// Helper method to update activity from any tab
	public updateUserActivity(userId: number): void {
		const userState = this.connections.get(userId)
		if (!userState) return
		userState.lastActivityAt = new Date()
	}
}
