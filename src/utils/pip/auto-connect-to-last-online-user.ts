import { isUndefined } from "lodash"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default function autoConnectToLastOnlineUser(pipId: PipUUID, preventAutoReconnectUserId?: number): void {
	try {
		const lastOnlineConnectedUserId = Esp32SocketManager.getInstance().getESPStatus(pipId)?.lastOnlineConnectedUser?.userId
		if (!lastOnlineConnectedUserId) return
		// This is to prevent auto-reconnect to the same user that just disconnected, if they closed the browser
		if (
			!isUndefined(preventAutoReconnectUserId) &&
			lastOnlineConnectedUserId === preventAutoReconnectUserId
		) return
		Esp32SocketManager.getInstance().setOnlineUserConnected(pipId, lastOnlineConnectedUserId)
		BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(lastOnlineConnectedUserId, pipId, "connected online to you")
	} catch (error) {
		console.error(error)
		throw error
	}
}
