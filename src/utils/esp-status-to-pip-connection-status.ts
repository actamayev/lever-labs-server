import isUndefined from "lodash/isUndefined"
import BrowserSocketManager from "../classes/browser-socket-manager"
import { ESPConnectionStatus, PipConnectionStatus, PipUUID } from "@bluedotrobots/common-ts"

export default function espStatusToPipConnectionStatus(
	espStatus: ESPConnectionStatus,
	pipUUID: PipUUID,
	userId: number,
	shouldAutoConnect: boolean
): PipConnectionStatus {
	try {
		if (espStatus === "updating firmware" || espStatus === "offline") {
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
