import { isNumber } from "lodash"
import { Response, Request } from "express"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { UserConnectedStatus } from "@actamayev/lever-labs-common-ts/protocol"
import { MessageBuilder } from "@actamayev/lever-labs-common-ts/message-builder"
import { ErrorResponse, SuccessResponse, MessageResponse} from "@actamayev/lever-labs-common-ts/types/api"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function clientConnectToPipRequest (req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const result = Esp32SocketManager.getInstance().setOnlineUserConnected(pipUUID, userId)
		if (result === false) {
			res.status(400).json({ message: "Unable to connect to Pip, serial connection is active" } satisfies MessageResponse)
			return
		} else if (isNumber(result)) {
			BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(result, pipUUID, "offline")
			BrowserSocketManager.getInstance().removePipConnection(result)
		}
		BrowserSocketManager.getInstance().updateCurrentlyConnectedPip(userId, pipUUID)

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createIsUserConnectedToPipMessage(UserConnectedStatus.CONNECTED)
		)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to connect to Pip" } satisfies ErrorResponse)
		return
	}
}
