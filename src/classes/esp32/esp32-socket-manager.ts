import { isNull } from "lodash"
import { Server as WSServer } from "ws"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import { ESPToServerMessage } from "@lever-labs/common-ts/types/pip"
import Singleton from "../singletons/singleton"
import isPipUUID from "../../utils/type-helpers/type-checks"
import BrowserSocketManager from "../browser-socket-manager"
import SingleESP32Connection from "./single-esp32-connection"
import SendEsp32MessageManager from "./send-esp32-message-manager"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import { UserConnectedStatus } from "@lever-labs/common-ts/protocol"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()
	private readonly NINETY_MINUTES_MS = 90 * 60 * 1000 // 90 minutes in milliseconds

	private constructor(private readonly wss: WSServer) {
		super()
		this.initializeWSServer()
		// TODO 9/21/25: Consider loading in all the pips from DB here
		// When we restart the server, and when we add a new pip (add new pip uuid) we need to reload the pips from DB
	}

	public static override getInstance(wss?: WSServer): Esp32SocketManager {
		if (!Esp32SocketManager.instance) {
			if (!wss) {
				throw new Error("WebSocket Server instance required to initialize Esp32SocketManager")
			}
			Esp32SocketManager.instance = new Esp32SocketManager(wss)
		}
		return Esp32SocketManager.instance
	}

	private initializeWSServer(): void {
		this.wss.on("connection", (socket: ExtendedWebSocket, request) => {
			try {
				// Extract pipId from headers
				const pipId = request.headers["x-pip-id"] as string

				if (!pipId || !isPipUUID(pipId)) {
					console.warn("Invalid or missing X-Pip-Id header")
					socket.close(1002, "Invalid or missing X-Pip-Id header")
					return
				}

				console.info(`ESP32 ${pipId} connected - registering immediately`)

				socket.pipId = pipId

				// ✅ IMMEDIATE REGISTRATION - happens right when WebSocket connects
				const connection = new SingleESP32Connection(
					pipId,
					socket,
					(disconnectedPipId: PipUUID) => void this.handleDisconnection(disconnectedPipId, false)
				)

				// ✅ TRACK ACTIVE CONNECTIONS - this replaces your registration message
				this.registerConnection(pipId, connection)

				socket.on("message", (message) => {
					this.handleOngoingMessage(pipId, message.toString())
				})
			} catch (error) {
				console.error(error)
				socket.close(1002, "Invalid or missing X-Pip-Id header")
				return
			}
		})
	}

	private handleOngoingMessage(pipId: PipUUID, message: string): void {
		try {
			const parsed = JSON.parse(message) as ESPToServerMessage
			const { route, payload } = parsed

			this.updateLastActivity(pipId)

			switch (route) {
			case "/device-initial-data":
				// TODO: Modify the ESP code to send the battery data along with the device initial data
				void SendEsp32MessageManager.getInstance().transferUpdateAvailableMessage(pipId, payload)
				break
			case "/sensor-data":
				BrowserSocketManager.getInstance().sendBrowserPipSensorData(pipId, payload)
				break
			case "/sensor-data-mz":
				BrowserSocketManager.getInstance().sendBrowserPipSensorDataMZ(pipId, payload)
				break
			case "/battery-monitor-data-full":
				BrowserSocketManager.getInstance().emitPipBatteryData(pipId, payload.batteryData)
				break
			case "/pip-turning-off":
				console.info(`ESP32 ${pipId} turning off, disconnecting`)
				this.handleDisconnection(pipId, true)
				break
			case "/dino-score":
				BrowserSocketManager.getInstance().emitPipDinoScore(pipId, payload.score)
				break
			default:
				console.warn(`Unknown route from ${pipId}: ${route}`)
				break
			}
		} catch (error) {
			console.error(`Failed to process message from ${pipId}:`, error)
		}
	}

	private updateLastActivity(pipId: PipUUID): void {
		const connectionInfo = this.connections.get(pipId)
		if (!connectionInfo) return
		// Reset the ping counter since we received data
		connectionInfo.connection?.resetPingCounter()
	}

	// eslint-disable-next-line max-lines-per-function
	private registerConnection(pipId: PipUUID, connection: SingleESP32Connection): void {
		try {
			const existing = this.connections.get(pipId)

			if (!existing) {
				// ✅ NEW CONNECTION - track it immediately
				const initialStatus = this.createInitialStatus()
				this.connections.set(pipId, { status: initialStatus, connection })
				return
			}

			console.info(`ESP32 ${pipId} connecting online, modifying existing connection`)
			existing.connection?.dispose()

			// Handle serial connection case
			if (existing.status.connectedToSerialUserId) {
				this.connections.set(pipId, {
					status: {
						...existing.status,
						online: true,
						connectedToOnlineUserId: existing.status.connectedToSerialUserId,
						lastOnlineConnectedUser: {
							userId: existing.status.connectedToSerialUserId,
							lastActivityAt: new Date()
						}
					},
					connection
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
						status: {
							...existing.status,
							online: true,
							connectedToOnlineUserId: null,
							lastOnlineConnectedUser: null
						},
						connection
					})
					return
				}

				// Check if user is currently online
				const hasActiveSockets = BrowserSocketManager.getInstance().hasActiveSockets(userId)
				if (hasActiveSockets) {
					// User is online - auto-reconnect
					this.connections.set(pipId, {
						status: {
							...existing.status,
							online: true,
							connectedToOnlineUserId: userId,
							lastOnlineConnectedUser: {
								userId,
								lastActivityAt: new Date()
							}
						},
						connection
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
				status: {
					...existing.status,
					online: true,
					connectedToOnlineUserId: null
				},
				connection
			})

		} catch (error) {
			console.error(`Failed to register connection for ${pipId}:`, error)
		}
	}

	public handleDisconnection(pipId: PipUUID, isShutdown: boolean): void {
		try {
			console.info(`ESP32 disconnected: ${pipId}`)

			// Get the connection before updating
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

			// Dispose of the connection object to stop ping intervals and clean up
			connectionInfo.connection?.dispose(true)
			const userConnectedToOnlineBeforeDisconnection = connectionInfo.status.connectedToOnlineUserId
			if (!userConnectedToOnlineBeforeDisconnection) return
			BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(userConnectedToOnlineBeforeDisconnection, pipId, "offline")
			BrowserSocketManager.getInstance().removePipConnection(userConnectedToOnlineBeforeDisconnection)
		} catch (error) {
			console.error(`Failed to handle disconnection for ${pipId}:`, error)
		}
	}

	public getESPStatus(pipId: PipUUID): ESPConnectionState | undefined {
		return this.connections.get(pipId)?.status
	}

	public getConnection(pipId: PipUUID): SingleESP32Connection | null | undefined {
		return this.connections.get(pipId)?.connection
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
				// If there's never been a connection to this pip before, we need to create a new connection info
				this.connections.set(pipId, {
					status: {
						online: false,
						connectedToOnlineUserId: null,
						lastOnlineConnectedUser: null,
						connectedToSerialUserId: userId
					},
					connection: null
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
