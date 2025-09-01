import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { PipUUID, ErrorResponse, SuccessResponse, MessageBuilder} from "@bluedotrobots/common-ts"

export default function changeAudibleStatus(req: Request, res: Response): void {
	try {
		const { pipUUID, audibleStatus } = req.body as { pipUUID: PipUUID, audibleStatus: boolean }

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(pipUUID, MessageBuilder.createSpeakerMuteMessage(audibleStatus))

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change audible status" } satisfies ErrorResponse)
		return
	}
}
