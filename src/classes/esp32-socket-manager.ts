import _ from "lodash"
import { IncomingMessage } from "http"
import WebSocket, { Server as WSServer } from "ws"
import Singleton from "./singleton"
import isPipUUID from "../utils/type-checks"
import BrowserSocketManager from "./browser-socket-manager"

export default class Esp32SocketManager extends Singleton {
	private connections = new Map<string, ESP32SocketConnectionInfo>() // Maps socketId to ESP32SocketConnectionInfo

	private constructor(private readonly wss: WSServer) {
		super()
		this.initializeListeners()
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

	private initializeListeners(): void {
		this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
			const socketId = req.headers["sec-websocket-key"] as string
			console.info(`ESP32 connected: ${socketId}`)

			let isRegistered = false // Track if the connection is registered with a UUID

			ws.on("message", (message) => {
				// Pass isRegistered by reference so it can be updated within handleMessage
				this.handleMessage(socketId, message.toString(), isRegistered, (registered) => {
					isRegistered = registered // Update isRegistered based on the result of handleMessage
				})
			})

			ws.on("close", () => this.handleDisconnection(socketId))
		})
	}

	// handleMessage handles both registration and regular message handling
	private handleMessage(
		clientId: string,
		message: string,
		isRegistered: boolean,
		setRegistered: (status: boolean) => void
	): void {
		console.info(`Message from ESP32 (${clientId}):`, message)

		if (isRegistered) {
			// Handle regular messages
			console.info(`Regular message from ESP32 (${clientId}):`, message)
			return
		}

		// Handle first message as registration
		try {
			const data = JSON.parse(message) as { pipUUID?: string }

			const pipUUID = data.pipUUID
			// Check if pipUUID exists
			if (_.isUndefined(pipUUID)) {
				console.warn(`No pipUUID found in message from ESP32 (${clientId}):`, message)
				return
			}

			// Validate pipUUID
			if (!isPipUUID(pipUUID)) {
				console.warn(`Invalid UUID received from ESP32 (${clientId}):`, pipUUID)
				return
			}

			// Register the connection
			this.addConnection(clientId, pipUUID)
			console.info(`Registered new ESP32 connection with UUID: ${pipUUID}`)
			setRegistered(true)  // Update isRegistered to true
		} catch (error) {
			console.error(`Failed to parse message from ESP32 (${clientId}):`, error)
		}
	}

	private addConnection(socketId: string, pipUUID: PipUUID): void {
		console.log("adding new connection")
		this.connections.set(socketId, { pipUUID, status: "connected" })
		BrowserSocketManager.getInstance().emitPipStatusUpdate(pipUUID, "online")
	}

	private handleDisconnection(socketId: string): void {
		const socketInfo = this.connections.get(socketId)
		if (!socketInfo) return
		BrowserSocketManager.getInstance().emitPipStatusUpdate(socketInfo.pipUUID, "inactive")
		this.connections.delete(socketId)
	}

	public getPreviouslyConnectedPipUUIDs(userPipUUIDs: PipUUID[]): PreviouslyConnectedPipUUIDs[] {
		return userPipUUIDs.map((pipUUID) => {
			return this.getPreviouslyConnectedPipUUID(pipUUID)
		})
	}

	public getPreviouslyConnectedPipUUID(userPipUUID: PipUUID): PreviouslyConnectedPipUUIDs {
		const connectionInfo = Array.from(this.connections.values()).find(
			(connection) => connection.pipUUID === userPipUUID
		)

		let status: PipBrowserConnectionStatus = "inactive"

		if (connectionInfo) {
			console.log("connectionInfo", connectionInfo)
			switch (connectionInfo.status) {
			case "inactive":
				status = "inactive"
				break
			case "updating firmware":
				status = "updating firmware"
				break
			case "connected":
				status = "connected to other user"
				break
			}
		}

		return { pipUUID: userPipUUID, status }
	}

	public isPipUUIDConnected(pipUUID: PipUUID): boolean {
		for (const connectionInfo of this.connections.values()) {
			if (connectionInfo.pipUUID === pipUUID && connectionInfo.status === "connected") {
				return true // Return true as soon as we find a match
			}
		}
		return false // Return false if no match is found
	}

	public getESPStatus(pipUUID: PipUUID): ESPConnectionStatus {
		// Iterate through connections to find the one with the specified userId
		for (const connectionInfo of this.connections.values()) {
			if (connectionInfo.pipUUID === pipUUID) {
				return connectionInfo.status
			}
		}
		// Return "inactive" if no matching pipUUID was found
		return "inactive"
	}

	// This method is called when a browser client that was connected to a Pip disconnects.
	public handleClientLogoff(pipUUID: PipUUID): void {
		for (const connectionInfo of this.connections.values()) {
			if (connectionInfo.pipUUID === pipUUID && connectionInfo.status === "connected") {
				connectionInfo.status = "inactive"
			}
		}
	}
}
