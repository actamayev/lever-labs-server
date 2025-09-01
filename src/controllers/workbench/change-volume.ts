import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse, MessageBuilder} from "@bluedotrobots/common-ts"

export default function changeVolume(req: Request, res: Response): void {
	try {
		const { pipUUID, volume } = req.body as { pipUUID: PipUUID, volume: number }

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createSpeakerVolumeMessage(volume)
		)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change volume" } satisfies ErrorResponse)
		return
	}
}
