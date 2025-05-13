import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function pollSensors(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		await SendEsp32MessageManager.getInstance().pollSensors(pipUUID)

		res.status(200).json({ success: "Polling sensors" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to poll sensors" } as ErrorResponse)
		return
	}
}
