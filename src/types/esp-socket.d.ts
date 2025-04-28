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


	type RoutePayloadMap = {
		"/register": PipUUIDPayload
		"/sensor-data": SensorPayload
		"/bytecode-status": BytecodeMessage
	}

	// Routes derived from the keys of the mapping
	type ESPRoutes = keyof RoutePayloadMap

	// Type-safe message interface
	interface ESPMessage<R extends ESPRoutes = ESPRoutes> {
		route: R
		payload: RoutePayloadMap[R]
	}

	interface PipUUIDPayload {
		pipUUID: PipUUID
		firmwareVersion: number
	}

	interface BytecodeMessage {
		message: string
	}
}

export {}
