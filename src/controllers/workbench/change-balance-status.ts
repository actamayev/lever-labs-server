import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse, MessageBuilder} from "@bluedotrobots/common-ts"

export default function changeBalanceStatus(req: Request, res: Response): void {
	try {
		const { pipUUID, balanceStatus } = req.body as { pipUUID: PipUUID, balanceStatus: boolean }

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createBalanceMessage(balanceStatus)
		)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change balance status" } satisfies ErrorResponse)
		return
	}
}
