import isUndefined from "lodash-es/isUndefined"
import BrowserSocketManager from "../classes/browser-socket-manager"

export default function espStatusToPipConnectionStatus(
	espStatus: ESPConnectionStatus,
	pipUUID: PipUUID,
	userId: number,
	shouldAutoConnect: boolean
): PipBrowserConnectionStatus {
	try {
		if (espStatus === "updating firmware" || espStatus === "inactive") {
			return espStatus
		}
		// The ESP is connected to the internet
		const connectedUserId = BrowserSocketManager.getInstance().whichUserConnectedToPipUUID(pipUUID)
		if (!isUndefined(connectedUserId) && connectedUserId !== userId) {
			// If the ESP is connected to the internet, and the UUID is connected to a user
			// That means the Pip is already connected to someone else
			return "connected to other user"
		}
		// If it's not connected to someone else, that means that it's available for the user to connect.
		// Retrun the status as connected (as in the user is now connected to the Pip)
		if (shouldAutoConnect === true) return "connected"
		return "online"
	} catch (error) {
		console.error(error)
		throw error
	}
}
