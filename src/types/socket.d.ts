import { WebSocket } from "ws"

declare global {
	interface PreviouslyConnectedPipUUIDs {
		pipUUID: PipUUID
		status: PipBrowserConnectionStatus
	}

	type BrowserSocketConnectionInfo = {
		userId: number
		previouslyConnectedPipUUIDs: PreviouslyConnectedPipUUIDs[]
	}

	type ESP32SocketConnectionInfo = {
		pipUUID: PipUUID
		status: ESPConnectionStatus
	}

	interface ExtendedWebSocket extends WebSocket {
		isAlive: boolean
	}
}

export {}
