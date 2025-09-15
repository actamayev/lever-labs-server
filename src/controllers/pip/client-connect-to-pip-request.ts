import { Response, Request } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { ErrorResponse, SuccessResponse, MessageResponse} from "@bluedotrobots/common-ts/types/api"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { UserConnectedStatus } from "@bluedotrobots/common-ts/protocol"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"

export default function clientConnectToPipRequest (req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		// Get current ESP status and set user as connected
		const currentStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)
		const connectedStatus: ESPConnectionState = {
			...currentStatus,
			connectedToOnlineUser: true
		}

		const isAdded = BrowserSocketManager.getInstance().addPipStatusToAccount(userId, pipUUID, connectedStatus)

		// Update ESP32 manager with user connection
		if (isAdded) {
			Esp32SocketManager.getInstance().setUserConnection(pipUUID, true)
		}
		if (!isAdded) {
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
