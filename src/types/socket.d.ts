import { WebSocket } from "ws"

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
		socket: ExtendedWebSocket
	}

	interface ExtendedWebSocket extends WebSocket {
		isAlive: boolean
	}
}

export {}
