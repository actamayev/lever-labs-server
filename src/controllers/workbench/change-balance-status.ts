import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function changeBalanceStatus(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, balanceStatus } = req.body as { pipUUID: PipUUID, balanceStatus: boolean }

		await SendEsp32MessageManager.getInstance().changeBalanceStatus(pipUUID, balanceStatus)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change balance status" } as ErrorResponse)
		return
	}
}
