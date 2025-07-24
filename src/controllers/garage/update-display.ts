import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function updateDisplayEndpoint(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, buffer } = req.body as { pipUUID: PipUUID, buffer: Uint8Array }

		await SendEsp32MessageManager.getInstance().updateDisplay(pipUUID, buffer)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update display" } satisfies ErrorResponse)
		return
	}
}
