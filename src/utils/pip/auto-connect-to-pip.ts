import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { UserConnectedStatus } from "@lever-labs/common-ts/protocol"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import { PipUUID } from "@lever-labs/common-ts/types/utils"

enum AutoConnectToPipResultEnum {
	SUCCESS = "SUCCESS",
	ERROR = "ERROR",
	NO_PIP_FOUND = "NO_PIP_FOUND"
}

interface AutoConnectToPipResult {
	result: AutoConnectToPipResultEnum
	pipUUID: PipUUID | null
}

export default async function autoConnectToPip(userId: number): Promise<AutoConnectToPipResult> {
	try {
		const pipUUID = Esp32SocketManager.getInstance().checkIfLastConnectedUserIdIsCurrentUser(userId)
		if (!pipUUID) return { result: AutoConnectToPipResultEnum.NO_PIP_FOUND, pipUUID: null }

		const success = Esp32SocketManager.getInstance().setOnlineUserConnected(pipUUID, userId)
		if (!success) return { result: AutoConnectToPipResultEnum.ERROR, pipUUID: null }
		await BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(userId, pipUUID)
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.CONNECTED)
		)
		return { result: AutoConnectToPipResultEnum.SUCCESS, pipUUID }
	} catch (error) {
		console.error(error)
		return { result: AutoConnectToPipResultEnum.ERROR, pipUUID: null }
	}
}
