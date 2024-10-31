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
		status: PipConnectionStatus
	}
}

export {}
