import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, TuneToPlay, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function playTune (req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, tuneToPlay } = req.body as { pipUUID: PipUUID, tuneToPlay: TuneToPlay }

		await SendEsp32MessageManager.getInstance().playSound(pipUUID, tuneToPlay)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to play tune" } satisfies ErrorResponse)
		return
	}
}
