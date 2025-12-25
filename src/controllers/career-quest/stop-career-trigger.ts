import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { MessageBuilder } from "@actamayev/lever-labs-common-ts/message-builder"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default async function stopCareerTrigger(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		await SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createStopCareerQuestTriggerMessage()
		)

		res.status(200).json({ success: "Career trigger stopped" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to trigger career quest message" } satisfies ErrorResponse)
		return
	}
}
