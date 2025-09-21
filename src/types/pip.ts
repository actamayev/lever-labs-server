declare global {
	interface ESPConnectionState {
		online: boolean                 // WebSocket connection active
		connectedToOnlineUserId: number | null   // UserId of the current user connected to the PIP via Browser
		connectedToSerialUserId: number | null      // UserId of the user currently connected to the PIP via USB/serial
		lastOnlineConnectedUser: {
			userId: number
			connectedAt: Date
		} | null
	}
}

export {}
