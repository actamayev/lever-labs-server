declare global {
	interface PipData {
		pipName: string
		userPipUUIDId: number
		pipUUID: PipUUID
		pipConnectionStatus: PipConnectionStatus
	}

	type PipConnectionStatus =
		"inactive" | // Pip is not connected to the internet
		"online" | // Pip is connected to the internet, but not connected to any browser clients
		"connected to other user" | // Connected to somone else
		"connected" // Connected to me
}

export {}
