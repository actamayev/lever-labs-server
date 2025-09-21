import { WebSocket } from "ws"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import SingleESP32Connection from "../classes/esp32/single-esp32-connection"

declare global {
	interface ESP32SocketConnectionInfo {
		status: ESPConnectionState
		connection: SingleESP32Connection
	}

	interface ExtendedWebSocket extends WebSocket {
		pipId: PipUUID
	}

	type DisconnectReason = "ping_timeout" | "ping_failed" | "socket_closed" | "socket_error" | "disposed"
}

export {}
