import { Request, Response } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"

export default async function stopSensorPolling(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		await SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createStopSensorPollingMessage()
		)

		res.status(200).json({ success: "Sensor polling stopped" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to stop sensor polling" } satisfies ErrorResponse)
		return
	}
}
