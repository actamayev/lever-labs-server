import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { UserConnectedStatus } from "@bluedotrobots/common-ts/protocol"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

export enum AutoConnectToPipResultEnum {
	SUCCESS = "SUCCESS",
	ERROR = "ERROR",
	NO_PIP_FOUND = "NO_PIP_FOUND"
}

interface AutoConnectToPipResult {
	result: AutoConnectToPipResultEnum
	pipUUID: PipUUID | null
}

export default function autoConnectToPip(userId: number): AutoConnectToPipResult {
	try {
		const pipUUID = Esp32SocketManager.getInstance().checkIfLastConnectedUserIdIsCurrentUser(userId)
		if (!pipUUID) return { result: AutoConnectToPipResultEnum.NO_PIP_FOUND, pipUUID: null }

		BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(userId, pipUUID)
		const success = Esp32SocketManager.getInstance().setOnlineUserConnected(pipUUID, userId)
		if (!success) return { result: AutoConnectToPipResultEnum.ERROR, pipUUID: null }
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
