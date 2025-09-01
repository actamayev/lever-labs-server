import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, TuneToPlay, ErrorResponse, SuccessResponse, MessageBuilder, tuneToSoundType} from "@bluedotrobots/common-ts"

export default function playTune(req: Request, res: Response): void {
	try {
		const { pipUUID, tuneToPlay } = req.body as { pipUUID: PipUUID, tuneToPlay: TuneToPlay }

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID, MessageBuilder.createSoundMessage(tuneToSoundType[tuneToPlay])
		)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to play tune" } satisfies ErrorResponse)
		return
	}
}
