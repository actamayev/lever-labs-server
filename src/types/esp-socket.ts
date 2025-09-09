import { WebSocket } from "ws"
import { ESPConnectionStatus } from "@bluedotrobots/common-ts/types/pip"
import ESP32Connection from "../classes/esp32/single-esp32-connection"

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
