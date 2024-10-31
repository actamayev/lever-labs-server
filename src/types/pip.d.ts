declare global {
	interface PipData {
		pipName: string
		userPipUUIDId: number
		pipUUID: PipUUID
	}

	type PipConnectionStatus = "not connected" | "connected"
}

export {}
