declare global {
	interface PipData {
		pipName: string
		userPipUUIDId: number
		pipUUID: PipUUID
		pipConnectionStatus: PipBrowserConnectionStatus
	}

	// This is what will be shown to the client
	type PipBrowserConnectionStatus =
		ESPConnectionStatus |
		// "offline" | // Pip is not connected to the internet/ is turned off.
		"online" | // Pip is connected to the internet, but not connected to any browser clients
		// "updating firmware" | // ESP changed to this state when client approves firmware update
		"connected to other user" // Connected to someone else
		// "connected" // Connected to me

	type ESPConnectionStatus =
		"offline" | // Not connected to internet/is turned off.
		"updating firmware" | // ESP changed to this state when client approves firmware update
		"connected" // Connected to the internet/is active

	interface FirmwareData {
		firmwareVersion: number
		firmwareBuffer: Buffer
	}
}

export {}
