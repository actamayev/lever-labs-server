import { Response, Request } from "express"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { UserConnectedStatus } from "@bluedotrobots/common-ts/protocol"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import { ErrorResponse, SuccessResponse, MessageResponse} from "@bluedotrobots/common-ts/types/api"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default function clientConnectToPipRequest (req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const success = Esp32SocketManager.getInstance().setOnlineUserConnected(pipUUID, userId)
		if (!success) {
			res.status(400).json({ message: "Unable to connect to Pip" } satisfies MessageResponse)
			return
		}

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
