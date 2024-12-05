import { WebSocket } from "ws"
import ESP32Connection from "../classes/esp32/single-esp32-connection"

declare global {
	interface PreviouslyConnectedPipUUIDs {
		pipUUID: PipUUID
		status: PipBrowserConnectionStatus
	}

	type BrowserSocketConnectionInfo = {
		socketId: string
		previouslyConnectedPipUUIDs: PreviouslyConnectedPipUUIDs[]
	}

	type ESP32SocketConnectionInfo = {
		socketId: string
		status: ESPConnectionStatus
		connection: ESP32Connection
	}

	interface ExtendedWebSocket extends WebSocket {
		isAlive: boolean
	}

	type DisconnectReason = "ping_timeout" | "ping_failed" | "socket_closed" |
    "socket_error" | "disposed";
}

export {}
