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
import SingletonWithRedis from "./singletons/singleton-with-redis"
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

export default class BrowserSocketManager extends SingletonWithRedis {
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

	public async getUserConnectionState(userId: number): Promise<UserConnectionState | undefined> {
		const redis = await this.getRedis()
		const data = await redis.get(`browser_connection:${userId}`)
		if (!data) return undefined

		const parsed = JSON.parse(data)
		return {
			sockets: new Set(parsed.sockets),
			currentlyConnectedPipUUID: parsed.currentlyConnectedPipUUID,
			lastActivityAt: new Date(parsed.lastActivityAt)
		}
	}

	// Helper method to get current pip for user
	public async getCurrentlyConnectedPipUUID(userId: number): Promise<PipUUID | null> {
		const userState = await this.getUserConnectionState(userId)
		return userState?.currentlyConnectedPipUUID || null
	}

	// Helper method to check if user has any active sockets
	public async hasActiveSockets(userId: number): Promise<boolean> {
		const userState = await this.getUserConnectionState(userId)
		return (userState?.sockets.size || 0) > 0
	}

	// Helper method to save user connection state to Redis
	private async saveUserConnectionState(userId: number, userState: UserConnectionState): Promise<void> {
		const redis = await this.getRedis()
		const serialized = {
			sockets: Array.from(userState.sockets),
			currentlyConnectedPipUUID: userState.currentlyConnectedPipUUID,
			lastActivityAt: userState.lastActivityAt.toISOString()
		}
		await redis.set(`browser_connection:${userId}`, JSON.stringify(serialized))
	}

	// Helper method to delete user connection state from Redis
	private async deleteUserConnectionState(userId: number): Promise<void> {
		const redis = await this.getRedis()
		await redis.del(`browser_connection:${userId}`)
	}

	private initializeListeners(): void {
		this.io.on("connection", (socket: Socket) => {
			void this.handleBrowserConnection(socket)
			this.setupAllListeners(socket)
		})
	}

	private async handleBrowserConnection(socket: Socket): Promise<void> {
		if (isUndefined(socket.userId)) {
			console.error(`User ${socket.userId} is not authenticated`)
			return
		}

		const userId = socket.userId
		const existingState = await this.getUserConnectionState(userId)
		const isFirstSocket = !existingState || existingState.sockets.size === 0

		await this.addSocketToUser(userId, socket.id)

		// Only attempt auto-connect if this is truly the first connection
		// and we don't already have a pip connection
		if (isFirstSocket && !existingState?.currentlyConnectedPipUUID) {
			// This is the first socket - attempt auto-connect
			await autoConnectToPip(userId)
		}

		// If user already connected to a pip, emit current status to this new socket
		const userState = await this.getUserConnectionState(userId)
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

		socket.on("disconnect", () => void this.handleDisconnection(userId, socket.id))
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

	private async addSocketToUser(userId: number, socketId: string): Promise<void> {
		const existingState = await this.getUserConnectionState(userId)

		if (existingState) {
			// Add socket to existing user state
			existingState.sockets.add(socketId)
			existingState.lastActivityAt = new Date()
			await this.saveUserConnectionState(userId, existingState)
		} else {
			// Create new user state
			const newState: UserConnectionState = {
				sockets: new Set([socketId]),
				currentlyConnectedPipUUID: null,
				lastActivityAt: new Date()
			}
			await this.saveUserConnectionState(userId, newState)
		}
	}

	private async handleDisconnection(userId: number, socketId: string): Promise<void> {
		try {
			const userState = await this.getUserConnectionState(userId)
			if (isUndefined(userState)) return

			// Remove this socket from user's socket list
			userState.sockets.delete(socketId)

			// If user still has other sockets open, just update activity and return
			if (userState.sockets.size > 0) {
				userState.lastActivityAt = new Date()
				await this.saveUserConnectionState(userId, userState)
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
			await this.deleteUserConnectionState(userId)
		} catch (error) {
			console.error("Error during disconnection:", error)
		}
	}

	public async emitPipStatusUpdateToUser(
		userId: number,
		pipUUID: PipUUID,
		newConnectionStatus: ClientPipConnectionStatus
	): Promise<void> {
		const userState = await this.getUserConnectionState(userId)
		if (isUndefined(userState)) return
		if (userState.currentlyConnectedPipUUID !== pipUUID) return

		// Emit to ALL sockets for this user
		this.emitToAllUserStateSockets(userState, "pip-connection-status-update", { pipUUID, newConnectionStatus })
	}

	public async updateCurrentlyConnectedPip(userId: number, pipUUID: PipUUID | null): Promise<void> {
		let userState = await this.getUserConnectionState(userId)

		if (isUndefined(userState)) {
			// Create a user state even if no sockets yet (e.g., during login auto-connect)
			userState = {
				sockets: new Set(),
				currentlyConnectedPipUUID: pipUUID,
				lastActivityAt: new Date()
			}
			await this.saveUserConnectionState(userId, userState)
			return
		}

		userState.currentlyConnectedPipUUID = pipUUID
		userState.lastActivityAt = new Date()
		await this.saveUserConnectionState(userId, userState)

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

	public async removePipConnection(userId: number): Promise<void> {
		const userState = await this.getUserConnectionState(userId)
		if (isUndefined(userState)) return

		const previousPipUUID = userState.currentlyConnectedPipUUID
		userState.currentlyConnectedPipUUID = null
		userState.lastActivityAt = new Date()
		await this.saveUserConnectionState(userId, userState)

		// Emit disconnection status to all user's sockets
		if (!previousPipUUID) return
		this.emitToAllUserStateSockets(userState, "pip-connection-status-update", {
			pipUUID: previousPipUUID,
			newConnectionStatus: "offline"
		})
	}

	private async emitDataToConnectedPipUsers<E extends SocketEvents>(
		pipUUID: PipUUID,
		event: E,
		payload: SocketEventPayloadMap[E]
	): Promise<void> {
		const redis = await this.getRedis()
		const keys = await redis.keys("browser_connection:*")

		for (const key of keys) {
			const data = await redis.get(key)
			if (!data) continue

			const userState = JSON.parse(data)
			if (userState.currentlyConnectedPipUUID !== pipUUID) continue

			const reconstructedState: UserConnectionState = {
				sockets: new Set(userState.sockets),
				currentlyConnectedPipUUID: userState.currentlyConnectedPipUUID,
				lastActivityAt: new Date(userState.lastActivityAt)
			}
			this.emitToAllUserStateSockets(reconstructedState, event, payload)
		}
	}

	public emitPipBatteryData(pipUUID: PipUUID, batteryData: BatteryMonitorData): void {
		// Find all users connected to this pip and emit to ALL their sockets
		void this.emitDataToConnectedPipUsers(pipUUID, "battery-monitor-data", { pipUUID, batteryData })
	}

	public emitPipDinoScore(pipUUID: PipUUID, score: number): void {
		void this.emitDataToConnectedPipUsers(pipUUID, "dino-score-update", { pipUUID, score })
	}

	public sendBrowserPipSensorData(pipUUID: PipUUID, sensorPayload: SensorPayload): void {
		void this.emitDataToConnectedPipUsers(pipUUID, "general-sensor-data", sensorPayload)
	}

	public sendBrowserPipSensorDataMZ(pipUUID: PipUUID, sensorPayload: SensorPayloadMZ): void {
		void this.emitDataToConnectedPipUsers(pipUUID, "general-sensor-data-mz", sensorPayload)
	}

	public async emitStudentJoinedClassroom(
		teacherUserId: number,
		classCode: ClassCode,
		studentUserId: number,
		studentId: number
	): Promise<void> {
		const userState = await this.getUserConnectionState(teacherUserId)
		if (isUndefined(userState) || userState.sockets.size === 0) return

		const studentUsername = await retrieveUsername(studentUserId)
		if (isUndefined(studentUsername)) return

		// Emit to all teacher's sockets
		this.emitToAllUserStateSockets(userState, "student-joined-classroom", {
			classCode, studentUsername: studentUsername || "", studentId
		})
	}

	public async emitStudentJoinedHub(teacherUserId: number, data: StudentJoinedHub): Promise<void> {
		const userState = await this.getUserConnectionState(teacherUserId)
		if (isUndefined(userState)) return

		this.emitToAllUserStateSockets(userState, "student-joined-hub", data)
	}

	public emitNewHubToStudents(studentUserIds: number[], hubInfo: StudentViewHubData): void {
		studentUserIds.forEach(studentUserId => {
			void this.emitToUser(studentUserId, "new-hub", hubInfo)
		})
	}

	public emitDeletedHubToStudents(studentUserIds: number[], deletedHubInfo: DeletedHub): void {
		studentUserIds.forEach(studentUserId => {
			void this.emitToUser(studentUserId, "deleted-hub", deletedHubInfo)
		})
	}

	public emitUpdatedHubToStudents(studentUserIds: number[], updatedHubInfo: UpdatedHubSlideId): void {
		studentUserIds.forEach(studentUserId => {
			void this.emitToUser(studentUserId, "updated-hub-slide-id", updatedHubInfo)
		})
	}

	public emitStudentLeftHub(teacherUserId: number, data: StudentLeftHub): void {
		void this.emitToUser(teacherUserId, "student-left-hub", data)
	}

	public async emitToUser<E extends SocketEvents>(
		userId: number,
		event: E,
		payload: SocketEventPayloadMap[E]
	): Promise<void> {
		const userState = await this.getUserConnectionState(userId)
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
			void this.emitToUser(studentUserId, "garage-driving-status-update", { garageDrivingStatus })
		})
	}

	public emitGarageSoundsStatusUpdateToStudents(studentUserIds: number[], garageSoundsStatus: boolean): void {
		studentUserIds.forEach(studentUserId => {
			void this.emitToUser(studentUserId, "garage-sounds-status-update", { garageSoundsStatus })
		})
	}

	public emitGarageLightsStatusUpdateToStudents(studentUserIds: number[], garageLightsStatus: boolean): void {
		studentUserIds.forEach(studentUserId => {
			void this.emitToUser(studentUserId, "garage-lights-status-update", { garageLightsStatus })
		})
	}

	public emitGarageDisplayStatusUpdateToStudents(studentUserIds: number[], garageDisplayStatus: boolean): void {
		studentUserIds.forEach(studentUserId => {
			void this.emitToUser(studentUserId, "garage-display-status-update", { garageDisplayStatus })
		})
	}

	// Helper method to update activity from any tab
	public async updateUserActivity(userId: number): Promise<void> {
		const userState = await this.getUserConnectionState(userId)
		if (!userState) return
		userState.lastActivityAt = new Date()
		await this.saveUserConnectionState(userId, userState)
	}
}
