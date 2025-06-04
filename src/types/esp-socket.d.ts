import { WebSocket } from "ws"
import ESP32Connection from "../classes/esp32/single-esp32-connection"
import { ESPConnectionStatus } from "@bluedotrobots/common-ts"

declare global {
	type ESP32SocketConnectionInfo = {
		socketId: string
		status: ESPConnectionStatus
		connection: ESP32Connection
	}

	interface ExtendedWebSocket extends WebSocket {
		isAlive: boolean
	}

	type DisconnectReason = "ping_timeout" | "ping_failed" | "socket_closed" | "socket_error" | "disposed"
}

export {}
