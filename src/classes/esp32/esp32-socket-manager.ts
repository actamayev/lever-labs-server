import { IncomingMessage } from "http"
import { Server as WSServer } from "ws"
import Singleton from "../singleton"
import isPipUUID from "../../utils/type-checks"
import BrowserSocketManager from "../browser-socket-manager"
import SingleESP32Connection from "./single-esp32-connection"
import SendEsp32MessageManager from "./send-esp32-message-manager"
import ESP32FirmwareUpdateManager from "./esp32-firmware-update-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<PipUUID, ESP32SocketConnectionInfo>()
	private readonly esp32FirmwareUpdateManager: ESP32FirmwareUpdateManager
	private readonly sendEsp32MessageManager: SendEsp32MessageManager

	// This map is redundant, but it's faster to search this map for a uuid directly than finding from the connections map
	private socketToPip = new Map<string, PipUUID>() // socketId--> PipUUID

	private constructor(private readonly wss: WSServer) {
		super()
		this.initializeWSServer()
		this.esp32FirmwareUpdateManager = ESP32FirmwareUpdateManager.getInstance()
		this.sendEsp32MessageManager = SendEsp32MessageManager.getInstance()
	}

	public static getInstance(wss?: WSServer): Esp32SocketManager {
		if (!Esp32SocketManager.instance) {
			if (!wss) {
				throw new Error("WebSocket Server instance required to initialize Esp32SocketManager")
			}
			Esp32SocketManager.instance = new Esp32SocketManager(wss)
		}
		return Esp32SocketManager.instance
	}

	private initializeWSServer(): void {
		this.wss.on("connection", (socket: ExtendedWebSocket, req: IncomingMessage) => {
			const socketId = req.headers["sec-websocket-key"] as string
			console.info(`ESP32 connected: ${socketId}`)

			const connection = new SingleESP32Connection(
				socketId,
				socket,
				(newSocketId) => this.handleDisconnection(newSocketId)
			)

			// Wait for registration message first
			socket.once("message", (message) => {
				this.handleRegistrationMessage(socketId, message.toString(), connection)

				// After registration, set up ongoing message handler
				this.setupOngoingMessageHandler(socketId, socket)
			})
		})
	}

	private handleRegistrationMessage(
		socketId: string,
		message: string,
		connection: SingleESP32Connection
	): void {
		try {
			const parsed = JSON.parse(message) as ESPMessage
			const { route, payload } = parsed

			if (route === "/register") {
				if (!isPipUUID((payload as PipUUIDPayload).pipUUID)) {
					console.warn(`Invalid registration from ${socketId}`)
					connection.dispose()
					return
				}
				this.registerConnection(socketId, (payload as PipUUIDPayload).pipUUID, connection)
			} else {
				console.warn(`Expected registration message, got: ${route}`)
				connection.dispose()
			}
		} catch (error) {
			console.error(`Failed to process registration message from ${socketId}:`, error)
			connection.dispose()
		}
	}

	private setupOngoingMessageHandler(
		socketId: string,
		socket: ExtendedWebSocket
	): void {
		socket.on("message", (message) => {
			this.handleOngoingMessage(socketId, message.toString())
		})
	}

	private handleOngoingMessage(
		socketId: string,
		message: string
	): void {
		try {
			const parsed = JSON.parse(message) as ESPMessage
			const { route, payload } = parsed

			switch (route) {
			case "/sensor-data":
				this.handleSensorData(socketId, payload as SensorPayload)
				break
			case "/bytecode-status":
				console.info("Bytecode status:", (payload as BytecodeMessage).message)
				break
			default:
				console.warn(`Unknown route: ${route}`)
				break
			}
		} catch (error) {
			console.error(`Failed to process message from ${socketId}:`, error)
		}
	}

	private handleSensorData(
		socketId: string,
		payload: SensorPayload
	): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) {
			console.warn(`Received sensor data from unregistered connection: ${socketId}`)
			return
		}

		// Forward to lab demo data manager
		BrowserSocketManager.getInstance().sendBrowserPipSensorData(pipUUID, payload)
	}

	private registerConnection(
		socketId: string,
		pipUUID: PipUUID,
		connection: SingleESP32Connection
	): void {
		// Clean up any existing connection for this PIP
		const existing = this.connections.get(pipUUID)
		if (existing) existing.connection.dispose()

		// Set up new connection
		this.connections.set(pipUUID, {
			socketId,
			status: "connected",
			connection
		})
		this.socketToPip.set(socketId, pipUUID)

		// Notify of status change
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "online")
	}

	private handleDisconnection(socketId: string): void {
		const pipUUID = this.socketToPip.get(socketId)
		if (!pipUUID) return

		console.info(`ESP32 disconnected: ${socketId} (PIP: ${pipUUID})`)

		// Clean up mappings
		this.connections.delete(pipUUID)
		this.socketToPip.delete(socketId)

		// Notify of status change
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "offline")
	}

	public getESPStatus(pipUUID: PipUUID): ESPConnectionStatus {
		return this.connections.get(pipUUID)?.status || "offline"
	}

	private getConnection(pipUUID: PipUUID): SingleESP32Connection | undefined {
		return this.connections.get(pipUUID)?.connection
	}

	public isPipUUIDConnected(pipUUID: PipUUID): boolean {
		const connectionInfo = this.connections.get(pipUUID)
		return connectionInfo?.status === "connected" || false
	}

	private async emitSocketCommand<T>(
		pipUUID: PipUUID,
		commandFn: (socket: ExtendedWebSocket, data: T) => Promise<void>,
		data: T,
		errorMessage: string
	): Promise<void> {
	// Get connection
		const connection = this.getConnection(pipUUID)
		if (!connection) {
			throw new Error(`No active connection for Pip ${pipUUID}`)
		}

		try {
			return await commandFn(connection.socket, data)
		} catch (error) {
			console.error(`${errorMessage} ${pipUUID}:`, error)
			throw error
		}
	}

	// Keep the original binary transfer method
	public async emitBinaryCodeToPip(pipUUID: PipUUID, binary: Buffer): Promise<void> {
		const connection = this.getConnection(pipUUID)
		if (!connection) {
			throw new Error(`No active connection for PIP ${pipUUID}`)
		}

		try {
			await this.esp32FirmwareUpdateManager.transferBinaryData(connection, binary)
		} catch (error) {
			console.error(`Failed to transfer code to PIP ${pipUUID}:`, error)
			throw error
		}
	}

	// Refactor the rest of the methods
	public async emitMotorControlToPip(pipUUID: PipUUID, motorControlData: Omit<IncomingMotorControlData, "pipUUID">): Promise<void> {
		return await this.emitSocketCommand<Omit<IncomingMotorControlData, "pipUUID">>(
			pipUUID,
			this.sendEsp32MessageManager.transferMotorControlData.bind(this.sendEsp32MessageManager),
			motorControlData,
			"Failed to send motor control command"
		)
	}

	public async emitNewLedColorsToPip(pipUUID: PipUUID, ledControlData: Omit<IncomingNewLedControlData, "pipUUID">): Promise<void> {
		return await this.emitSocketCommand<Omit<IncomingNewLedControlData, "pipUUID">>(
			pipUUID,
			this.sendEsp32MessageManager.transferLedControlData.bind(this.sendEsp32MessageManager),
			ledControlData,
			"Failed to led control command"
		)
	}

	public async emitTuneToPlay(pipUUID: PipUUID, tuneToPlay: TuneToPlay): Promise<void> {
		return await this.emitSocketCommand<TuneToPlay>(
			pipUUID,
			this.sendEsp32MessageManager.playSound.bind(this.sendEsp32MessageManager),
			tuneToPlay,
			"Failed to send tune to play"
		)
	}

	public async emitLightAnimation(pipUUID: PipUUID, lightAnimation: LightAnimation): Promise<void> {
		return await this.emitSocketCommand<LightAnimation>(
			pipUUID,
			this.sendEsp32MessageManager.displayLights.bind(this.sendEsp32MessageManager),
			lightAnimation,
			"Failed to send light status"
		)
	}

	public async emitChangeAudibleStatus(pipUUID: PipUUID, audibleStatus: boolean): Promise<void> {
		return await this.emitSocketCommand<boolean>(
			pipUUID,
			this.sendEsp32MessageManager.changeAudibleStatus.bind(this.sendEsp32MessageManager),
			audibleStatus,
			"Failed to audible status"
		)
	}

	public async emitChangeBalanceStatus(pipUUID: PipUUID, balanceStatus: boolean): Promise<void> {
		return await this.emitSocketCommand<boolean>(
			pipUUID,
			this.sendEsp32MessageManager.changeBalanceStatus.bind(this.sendEsp32MessageManager),
			balanceStatus,
			"Failed to change balance status"
		)
	}

	public async emitChangeBalancePids(pipUUID: PipUUID, pidsData: Omit<BalancePidsProps, "pipUUID">): Promise<void> {
		return await this.emitSocketCommand<Omit<BalancePidsProps, "pipUUID">>(
			pipUUID,
			this.sendEsp32MessageManager.changeBalancePids.bind(this.sendEsp32MessageManager),
			pidsData,
			"Failed to change balance PIDs"
		)
	}

	public async emitBytecodeToPip(pipUUID: PipUUID, byteCode: Float32Array): Promise<void> {
		return await this.emitSocketCommand<Float32Array>(
			pipUUID,
			this.sendEsp32MessageManager.sendBytecodeToPip.bind(this.sendEsp32MessageManager),
			byteCode,
			"Failed to send motor control command"
		)
	}
}
