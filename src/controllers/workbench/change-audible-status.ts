import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID } from "@bluedotrobots/common-ts"

export default async function changeAudibleStatus(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, audibleStatus } = req.body as { pipUUID: PipUUID, audibleStatus: boolean }

		await SendEsp32MessageManager.getInstance().changeAudibleStatus(pipUUID, audibleStatus)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change audible status" })
		return
	}
}
