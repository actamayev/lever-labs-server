import { isNull } from "lodash"
import { Server as WSServer } from "ws"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { ESPToServerMessage } from "@actamayev/lever-labs-common-ts/types/pip"
import Singleton from "../singleton"
import isPipUUID from "../../utils/type-helpers/type-checks"
import BrowserSocketManager from "../browser-socket-manager"
import SendEsp32MessageManager from "./send-esp32-message-manager"
import doesPipUUIDExist from "../../db-operations/read/does-x-exist/does-pip-uuid-exist"
import SingleESP32CommandConnection from "./single-esp32-connection"
import { MessageBuilder } from "@actamayev/lever-labs-common-ts/message-builder"
import { UserConnectedStatus } from "@actamayev/lever-labs-common-ts/protocol"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32ConnectionInfo>()
	private readonly NINETY_MINUTES_MS = 90 * 60 * 1000

	private constructor(
		private readonly commandWSS: WSServer,
		private readonly sensorWSS: WSServer // NEW
	) {
		super()
		this.initializeCommandWSServer()
		this.initializeSensorWSServer() // NEW
	}

	public static override getInstance(commandWSS?: WSServer, sensorWSS?: WSServer): Esp32SocketManager {
		if (!Esp32SocketManager.instance) {
			if (!commandWSS || !sensorWSS) {
				throw new Error("Both WebSocket Server instances required")
			}
			Esp32SocketManager.instance = new Esp32SocketManager(commandWSS, sensorWSS)
		}
		return Esp32SocketManager.instance
	}

	private initializeCommandWSServer(): void {
		this.commandWSS.on("connection", (socket: ExtendedWebSocket, request): void => {
			void (async (): Promise<void> => {
				try {
					const pipId = request.headers["x-pip-id"] as string

					if (!pipId || !isPipUUID(pipId)) {
						console.warn("Invalid X-Pip-Id header on command connection")
						socket.close(1002, "Invalid X-Pip-Id header")
						return
					}

					const pipIdExists = await doesPipUUIDExist(pipId)
					if (!pipIdExists) {
						console.warn(`PipId ${pipId} does not exist`)
						socket.close(1002, "PipId does not exist")
						return
					}

					console.info(`ESP32 ${pipId} command connection established`)
					socket.pipId = pipId

					const connection = new SingleESP32CommandConnection(
						pipId,
						socket,
						(disconnectedPipId: PipUUID) => void this.handleCommandDisconnection(disconnectedPipId, false)
					)

					this.registerCommandConnection(pipId, connection)

					socket.on("message", (message) => {
						this.handleCommandMessage(pipId, message.toString())
					})
				} catch (error) {
					console.error(error)
					socket.close(1002, "Connection setup failed")
				}
			})()
		})
	}

	private initializeSensorWSServer(): void {
		this.sensorWSS.on("connection", (socket: ExtendedWebSocket, request): void => {
			void ((): void => {
				try {
					const pipId = request.headers["x-pip-id"] as string

					if (!pipId || !isPipUUID(pipId)) {
						console.warn("Invalid X-Pip-Id header on sensor connection")
						socket.close(1002, "Invalid X-Pip-Id header")
						return
					}

					console.info(`ESP32 ${pipId} sensor connection established`)
					socket.pipId = pipId

					// Simpler connection - no ping/pong needed
					this.registerSensorConnection(pipId, socket)

					socket.on("message", (message) => {
						this.handleSensorMessage(pipId, message.toString())
					})

					socket.on("close", () => {
						console.info(`ESP32 ${pipId} sensor connection closed`)
						this.handleSensorDisconnection(pipId)
					})
				} catch (error) {
					console.error(error)
					socket.close(1002, "Connection setup failed")
				}
			})()
		})
	}

	private handleCommandMessage(pipId: PipUUID, message: string): void {
		try {
			const parsed = JSON.parse(message) as ESPToServerMessage
			const { route, payload } = parsed

			this.updateLastActivity(pipId)

			switch (route) {
			case "/device-initial-data":
				BrowserSocketManager.getInstance().emitPipBatteryData(pipId, payload.batteryData)
				void SendEsp32MessageManager.getInstance().transferUpdateAvailableMessage(pipId, payload)
				break
			case "/battery-monitor-data-full":
				BrowserSocketManager.getInstance().emitPipBatteryData(pipId, payload.batteryData)
				break
			case "/heartbeat":
				// Heartbeat received - just update activity
				break
			case "/pip-turning-off":
				console.info(`ESP32 ${pipId} turning off`)
				this.handleCommandDisconnection(pipId, true)
				break
			case "/dino-score":
				BrowserSocketManager.getInstance().emitPipDinoScore(pipId, payload.score)
				break
			default:
				console.warn(`Unknown route from ${pipId}: ${route}`)
				break
			}
		} catch (error) {
			console.error(`Failed to process command message from ${pipId}:`, error)
		}
	}

	private handleSensorMessage(pipId: PipUUID, message: string): void {
		try {
			const parsed = JSON.parse(message) as ESPToServerMessage
			const { route, payload } = parsed

			switch (route) {
			case "/sensor-data":
				BrowserSocketManager.getInstance().sendBrowserPipSensorData(pipId, payload)
				break
			case "/sensor-data-mz":
				BrowserSocketManager.getInstance().sendBrowserPipSensorDataMZ(pipId, payload)
				break
			default:
				console.warn(`Unknown sensor route from ${pipId}: ${route}`)
				break
			}
		} catch (error) {
			console.error(`Failed to process sensor message from ${pipId}:`, error)
		}
	}


	private updateLastActivity(pipId: PipUUID): void {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return
		// Reset the ping counter AND update heartbeat
		connectionInfo.commandConnection?.resetPingCounter()
	}

	// eslint-disable-next-line max-lines-per-function
	private registerCommandConnection(pipId: PipUUID, connection: SingleESP32CommandConnection): void {
		try {
			const existing = this.connections.get(pipId)

			if (!existing) {
				// ✅ NEW CONNECTION - track it immediately
				const initialStatus = this.createInitialStatus()
				this.connections.set(pipId, {
					status: initialStatus,
					commandConnection: connection,
					sensorSocket: null
				})

				// Notify user if they were previously connected
				this.checkForAutoReconnect(pipId)
				return
			}

			console.info(`ESP32 ${pipId} command connection updating`)
			existing.commandConnection?.dispose()

			// Handle serial connection case
			if (existing.status.connectedToSerialUserId) {
				this.connections.set(pipId, {
					...existing,
					status: {
						...existing.status,
						online: true, // ADDED: Mark as online
						connectedToOnlineUserId: existing.status.connectedToSerialUserId,
						lastOnlineConnectedUser: {
							userId: existing.status.connectedToSerialUserId,
							lastActivityAt: new Date()
						}
					},
					commandConnection: connection
				})
				return
			}

			// Check if we should auto-reconnect to a previously connected user
			if (existing.status.lastOnlineConnectedUser) {
				const userId = existing.status.lastOnlineConnectedUser.userId

				// Check time limit
				const timeSinceLastConnection = Date.now() - existing.status.lastOnlineConnectedUser.lastActivityAt.getTime()
				if (timeSinceLastConnection > this.NINETY_MINUTES_MS) {
					// Too old, clear it
					this.connections.set(pipId, {
						...existing,
						status: {
							...existing.status,
							online: true, // ADDED: Mark as online
							connectedToOnlineUserId: null,
							lastOnlineConnectedUser: null
						},
						commandConnection: connection
					})
					return
				}

				// Check if user is currently online
				const hasActiveSockets = BrowserSocketManager.getInstance().hasActiveSockets(userId)
				if (hasActiveSockets) {
					// User is online - auto-reconnect
					this.connections.set(pipId, {
						...existing,
						status: {
							...existing.status,
							online: true, // ADDED: Mark as online (was already here)
							connectedToOnlineUserId: userId,
							lastOnlineConnectedUser: {
								userId,
								lastActivityAt: new Date()
							}
						},
						commandConnection: connection
					})

					// Notify ESP
					void SendEsp32MessageManager.getInstance().sendBinaryMessage(
						pipId,
						MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.CONNECTED)
					)

					// Update browser state
					BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(userId, pipId)
					BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(userId, pipId, "connected online to you")

					return
				}
			}

			// Default case: just mark as online, no auto-connect
			this.connections.set(pipId, {
				...existing,
				status: {
					...existing.status,
					online: true, // ADDED: Mark as online
					connectedToOnlineUserId: null
				},
				commandConnection: connection
			})

		} catch (error) {
			console.error(`Failed to register command connection for ${pipId}:`, error)
		}
	}

	// NEW helper method for checking auto-reconnect on first connection
	private checkForAutoReconnect(pipId: PipUUID): void {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return

		// This handles the case where this is the FIRST connection ever
		// Check if a user should be auto-reconnected based on recent activity
		// (This logic is similar to what's in registerCommandConnection for existing connections)
		// For now, we can leave this empty since the main logic is in registerCommandConnection
	}

	private registerSensorConnection(pipId: PipUUID, socket: ExtendedWebSocket): void {
		const existing = this.connections.get(pipId)

		if (!existing) {
			console.warn(`Sensor connection for ${pipId} but no command connection exists`)
			return
		}

		console.info(`ESP32 ${pipId} sensor connection registered`)
		this.connections.set(pipId, {
			...existing,
			sensorSocket: socket
		})
	}

	public handleCommandDisconnection(pipId: PipUUID, isShutdown: boolean): void {
		try {
			console.info(`ESP32 command disconnected: ${pipId}`)

			const connectionInfo = this.connections.get(pipId)
			if (!connectionInfo) return

			const updatedStatus: ESPConnectionState = {
				...connectionInfo.status,
				online: false,
				connectedToOnlineUserId: null,
				connectedToSerialUserId: isShutdown ? null : connectionInfo.status.connectedToSerialUserId
			}

			this.connections.set(pipId, {
				...connectionInfo,
				status: updatedStatus
			})

			connectionInfo.commandConnection?.dispose(true)

			const userConnectedToOnlineBeforeDisconnection = connectionInfo.status.connectedToOnlineUserId
			if (!userConnectedToOnlineBeforeDisconnection) return

			BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(
				userConnectedToOnlineBeforeDisconnection,
				pipId,
				"offline"
			)
			BrowserSocketManager.getInstance().removePipConnection(userConnectedToOnlineBeforeDisconnection)
		} catch (error) {
			console.error(`Failed to handle command disconnection for ${pipId}:`, error)
		}
	}

	private handleSensorDisconnection(pipId: PipUUID): void {
		try {
			console.info(`ESP32 sensor disconnected: ${pipId}`)

			const connectionInfo = this.connections.get(pipId)
			if (!connectionInfo) return

			// Just clear the sensor socket - don't change status
			// The command connection determines online/offline status
			this.connections.set(pipId, {
				...connectionInfo,
				sensorSocket: null
			})
		} catch (error) {
			console.error(`Failed to handle sensor disconnection for ${pipId}:`, error)
		}
	}

	public getESPStatus(pipId: PipUUID): ESPConnectionState | undefined {
		return this.connections.get(pipId)?.status
	}

	public getCommandConnection(pipId: PipUUID): SingleESP32CommandConnection | null | undefined {
		return this.connections.get(pipId)?.commandConnection
	}

	public isPipUUIDConnected(pipId: PipUUID): boolean {
		const status = this.getESPStatus(pipId)
		return status?.online || false
	}

	public getAllConnectedPipUUIDs(): PipUUID[] {
		const connectedPipUUIDs: PipUUID[] = []
		for (const [pipId, connectionInfo] of this.connections) {
			if (connectionInfo.status.online) {
				connectedPipUUIDs.push(pipId)
			}
		}
		return connectedPipUUIDs
	}

	// Updated methods for managing connection states
	public handleSerialConnect(pipId: PipUUID, userId: number): number | null {
		try {
			const connectionInfo = this.connections.get(pipId)
			if (!connectionInfo) {
				// Create connection info for offline + serial case
				this.connections.set(pipId, {
					status: {
						online: false,
						connectedToOnlineUserId: null,
						lastOnlineConnectedUser: null,
						connectedToSerialUserId: userId
					},
					commandConnection: null, // CHANGED
					sensorSocket: null // CHANGED
				})
				return null
			}

			let lastOnlineConnectedUser: LastOnlineConnectedUser | null = null
			// If the pip is online, we need to update the last online connected user
			if (connectionInfo.status.online) {
				lastOnlineConnectedUser = {
					userId,
					lastActivityAt: new Date()
				}
			}

			this.connections.set(pipId, {
				...connectionInfo,
				status: {
					...connectionInfo.status,
					connectedToSerialUserId: userId,
					lastOnlineConnectedUser
				}
			})

			return connectionInfo.status.connectedToOnlineUserId
		} catch (error) {
			console.error(`Failed to handle serial connect for ${pipId}:`, error)
			throw error
		}
	}

	public handleSerialDisconnect(pipId: PipUUID): void {
		try {
			const connectionInfo = this.connections.get(pipId)
			if (!connectionInfo) return
			this.connections.set(pipId, {
				...connectionInfo,
				status: {
					...connectionInfo.status,
					connectedToSerialUserId: null
				}
			})
		} catch (error) {
			console.error(`Failed to handle serial disconnect for ${pipId}:`, error)
			throw error
		}
	}

	public setOnlineUserConnected(pipId: PipUUID, userId: number): boolean | number {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return false
		if (connectionInfo.status.connectedToSerialUserId) {
			console.warn(`Cannot connect user to ${pipId}: serial connection is active`)
			return false
		}
		let result: boolean | number = true
		if (connectionInfo.status.connectedToOnlineUserId && connectionInfo.status.connectedToOnlineUserId !== userId) {
			console.info(`Kicking user ${connectionInfo.status.connectedToOnlineUserId} from ${pipId}`)
			result = connectionInfo.status.connectedToOnlineUserId
		}
		this.connections.set(pipId, {
			...connectionInfo,
			status: {
				...connectionInfo.status,
				connectedToOnlineUserId: userId,
				lastOnlineConnectedUser: {
					userId,
					lastActivityAt: new Date()
				}
			}
		})

		return result
	}

	public setOnlineUserDisconnected(pipId: PipUUID, preventAutoReconnect: boolean): boolean {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return false
		this.connections.set(pipId, {
			...connectionInfo,
			status: {
				...connectionInfo.status,
				connectedToOnlineUserId: null,
				lastOnlineConnectedUser: preventAutoReconnect ? null : connectionInfo.status.lastOnlineConnectedUser
			}
		})
		return true
	}

	private createInitialStatus(): ESPConnectionState {
		return {
			online: true,
			connectedToOnlineUserId: null,
			connectedToSerialUserId: null,
			lastOnlineConnectedUser: null
		}
	}

	public updateLastActivityForUser(pipId: PipUUID, userId: number): void {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return

		// Only update if this user is the current connected user
		if (connectionInfo.status.connectedToOnlineUserId !== userId) return
		this.connections.set(pipId, {
			...connectionInfo,
			status: {
				...connectionInfo.status,
				lastOnlineConnectedUser: {
					userId,
					lastActivityAt: new Date()
				}
			}
		})
	}

	public checkIfLastConnectedUserIdIsCurrentUser(userId: number): PipUUID | null {
		for (const [pipId, connectionInfo] of this.connections) {
			if (isNull(connectionInfo.status.lastOnlineConnectedUser)) continue

			// Check if the last connection was more than 90 minutes ago
			const timeSinceLastConnection = Date.now() - connectionInfo.status.lastOnlineConnectedUser.lastActivityAt.getTime()
			if (timeSinceLastConnection > this.NINETY_MINUTES_MS) {
				this.connections.set(pipId, {
					...connectionInfo,
					status: {
						...connectionInfo.status,
						lastOnlineConnectedUser: null
					}
				})
				continue
			}

			if (
				isNull(connectionInfo.status.connectedToOnlineUserId) &&
				connectionInfo.status.lastOnlineConnectedUser.userId === userId &&
				connectionInfo.status.online
			) {
				return pipId
			}
		}
		return null
	}

	public getUserIdConnectedToOnlinePip(pipId: PipUUID): number | undefined {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return undefined
		if (isNull(connectionInfo.status.connectedToOnlineUserId)) return undefined
		return connectionInfo.status.connectedToOnlineUserId
	}

	public getIsUserIdConnectedToOnlinePip(pipId: PipUUID, userId: number): boolean {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return false
		if (isNull(connectionInfo.status.connectedToOnlineUserId)) return false
		return connectionInfo.status.connectedToOnlineUserId === userId
	}
}
