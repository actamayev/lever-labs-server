import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { MessageBuilder } from "@actamayev/lever-labs-common-ts/message-builder"

export default function stopCurrentlyRunningSandboxCode(req: Request, res: Response): void {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createStopSandboxCodeMessage()
		)

		res.status(200).json({ success: "Stopped currently running sandbox code" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to stop currently running sandbox code" } satisfies ErrorResponse)
		return
	}
}
