declare global {
	type ESPConnectionState = {
		online: boolean                 // WebSocket connection active
		connectedToOnlineUser: boolean  // Browser actively controlling (mutually exclusive with serial)
		connectedToSerial: boolean      // Browser connected via USB/serial (trumps online user)
	}
	interface FirmwareData {
		firmwareVersion: number
		firmwareBuffer: Buffer
	}
}

export {}
