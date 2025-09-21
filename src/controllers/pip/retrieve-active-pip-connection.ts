import { Request, Response } from "express"
import { ErrorResponse, RetrieveActivePipConnectionResponse } from "@bluedotrobots/common-ts/types/api"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import { UserConnectedStatus } from "@bluedotrobots/common-ts/protocol"

export default function retrieveActivePipConnection(req: Request, res: Response): void {
	try {
		const { userId } = req
		const pipUUID = Esp32SocketManager.getInstance().checkIfLastConnectedUserIdIsCurrentUser(userId)
		if (pipUUID) {
			BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(userId, pipUUID)
			const success = Esp32SocketManager.getInstance().setOnlineUserConnected(pipUUID, userId)
			if (!success) {
				res.status(400).json({ error: "Unable to set online user connected" } satisfies ErrorResponse)
				return
			}
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				pipUUID,
				MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.CONNECTED)
			)
		}

		res.status(200).json({ pipUUID } satisfies RetrieveActivePipConnectionResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve active Pip Connection" } satisfies ErrorResponse)
		return
	}
}
