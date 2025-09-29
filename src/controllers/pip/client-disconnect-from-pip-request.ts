import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { ErrorResponse, SuccessResponse, MessageResponse } from "@lever-labs/common-ts/types/api"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { UserConnectedStatus } from "@lever-labs/common-ts/protocol"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default async function clientDisconnectFromPipRequest (req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const success = Esp32SocketManager.getInstance().setOnlineUserDisconnected(pipUUID, true)
		await BrowserSocketManager.getInstance().removePipConnection(userId)
		if (!success) {
			res.status(400).json({ message: "Unable to disconnect from Pip" } satisfies MessageResponse)
			return
		}
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.NOT_CONNECTED)
		)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to disconnect from Pip" } satisfies ErrorResponse)
		return
	}
}
