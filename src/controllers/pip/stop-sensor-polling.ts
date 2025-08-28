import { Request, Response } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ErrorResponse, PipUUID, SuccessResponse } from "@bluedotrobots/common-ts"

export default async function stopSensorPolling(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.params as { pipUUID: PipUUID }

		await SendEsp32MessageManager.getInstance().stopSensorPolling(pipUUID)

		res.status(200).json({ success: "Sensor polling stopped" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to stop sensor polling" } satisfies ErrorResponse)
		return
	}
}
