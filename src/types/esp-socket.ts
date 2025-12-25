import { WebSocket } from "ws"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import SingleESP32CommandConnection from "../classes/esp32/single-esp32-connection"

declare global {
	interface ESP32ConnectionInfo {
		status: ESPConnectionState
		commandConnection: SingleESP32CommandConnection | null
		sensorSocket: ExtendedWebSocket | null // NEW: Simple socket for sensor data
	}

	interface ExtendedWebSocket extends WebSocket {
		pipId: PipUUID
	}

	type DisconnectReason = "ping_timeout" | "ping_failed" | "socket_closed" | "socket_error" | "disposed" | "heartbeat_timeout"

	interface LastOnlineConnectedUser {
		userId: number
		lastActivityAt: Date
	}

	interface ESPConnectionState {
		online: boolean                 // WebSocket connection active
		connectedToOnlineUserId: number | null   // UserId of the current user connected to the PIP via Browser
		connectedToSerialUserId: number | null      // UserId of the user currently connected to the PIP via USB/serial
		lastOnlineConnectedUser: LastOnlineConnectedUser | null
	}
}

export {}
