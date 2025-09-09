import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import { CareerType, ValidTriggerMessageType } from "@bluedotrobots/common-ts/protocol"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default async function triggerCareerQuestMessage (req: Request, res: Response): Promise<void> {
	try {
		const { careerType, triggerMessageType, pipUUID } = req.body as {
			pipUUID: PipUUID
			careerType: CareerType
			triggerMessageType: ValidTriggerMessageType<CareerType>
		}

		await SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createTriggerMessage(careerType, triggerMessageType)
		)

		res.status(200).json({ success: "Career quest message triggered" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to trigger career quest message" } satisfies ErrorResponse)
		return
	}
}
