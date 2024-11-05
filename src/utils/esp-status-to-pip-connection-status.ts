import BrowserSocketManager from "../classes/browser-socket-manager"

export default function espStatusToPipConnectionStatus(
	espStatus: ESPConnectionStatus,
	pipUUID: PipUUID
): PipBrowserConnectionStatus {
	try {
		if (espStatus === "updating firmware") return "updating firmware"
		else if (espStatus === "connected") {// The ESP is connected to the internet
			if (BrowserSocketManager.getInstance().isUUIDConnected(pipUUID)) {
				// If the ESP is connected to the internet, and the UUID is connected to a user
				// That means the Pip is already connected to someone else
				return "connected to other user"
			}
			// If it's not connected to someone else, that means that it's available for the user to connect.
			// Retrun the status as connected (as in the user is now connected to the Pip)
			return "connected"
		}
		return "inactive"
	} catch (error) {
		console.error(error)
		throw error
	}
}
