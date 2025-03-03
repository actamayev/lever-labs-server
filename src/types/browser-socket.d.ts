declare global {
	interface PreviouslyConnectedPipUUIDs {
		pipUUID: PipUUID
		status: PipBrowserConnectionStatus
	}

	type BrowserSocketConnectionInfo = {
		socketId: string
		previouslyConnectedPipUUIDs: PreviouslyConnectedPipUUIDs[]
	}
}

export {}
