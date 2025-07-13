import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function sendSandboxCodeToPip(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }
		const { bytecode } = req

		await SendEsp32MessageManager.getInstance().sendBytecodeToPip(pipUUID, bytecode)

		res.status(200).json({ success: "Sent bytecode to Pip" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to send bytecode to Pip" } satisfies ErrorResponse)
		return
	}
}
