import { WebSocket } from "ws"
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

	interface TransferMetadata {
		event: "new-user-code-meta"
		chunkIndex: number
		totalChunks: number
		totalSize: number
		isLast: boolean
		chunkSize: number
	}

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

	// Payload type definitions
	interface SensorPayload {
		leftWheelRPM: number
		rightWheelRPM: number
		irSensorData: number[] & { length: 5 }

		redValue: number
		greenValue: number
		blueValue: number

		pitch: number
		yaw: number
		roll: number

		aX: number
		aY: number
		aZ: number

		gX: number
		gY: number
		gZ: number

		mX: number
		mY: number
		mZ: number
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
