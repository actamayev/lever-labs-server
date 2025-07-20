import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function changeVolume(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, volume } = req.body as { pipUUID: PipUUID, volume: number }

		await SendEsp32MessageManager.getInstance().changeVolume(pipUUID, volume)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change volume" } satisfies ErrorResponse)
		return
	}
}
