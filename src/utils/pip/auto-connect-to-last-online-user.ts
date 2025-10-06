import { isUndefined } from "lodash"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import { UserConnectedStatus } from "@lever-labs/common-ts/protocol"

export default function autoConnectToLastOnlineUser(pipId: PipUUID, preventAutoReconnectUserId?: number): void {
	try {
		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipId)

		if (!espStatus) return

		// Check if ESP32 is actually online first
		if (!espStatus.online) {
			console.info(`Cannot auto-reconnect user to ${pipId} - ESP32 is offline`)
			return
		}

		const lastOnlineConnectedUserId = espStatus.lastOnlineConnectedUser?.userId
		if (!lastOnlineConnectedUserId) return

		// This is to prevent auto-reconnect to the same user that just disconnected, if they closed the browser
		if (
			!isUndefined(preventAutoReconnectUserId) &&
			lastOnlineConnectedUserId === preventAutoReconnectUserId
		) return

		Esp32SocketManager.getInstance().setOnlineUserConnected(pipId, lastOnlineConnectedUserId)
		BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(lastOnlineConnectedUserId, pipId)
		BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(lastOnlineConnectedUserId, pipId, "connected online to you")
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipId,
			MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.CONNECTED)
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}
