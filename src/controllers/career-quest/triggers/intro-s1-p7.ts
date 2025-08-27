import { Request, Response } from "express"
import { ErrorResponse, PipUUID, SuccessResponse } from "@bluedotrobots/common-ts"
import SendEsp32MessageManager from "../../../classes/esp32/send-esp32-message-manager"

export default async function triggerIntroS1P7 (req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.params as { pipUUID: PipUUID }

		await SendEsp32MessageManager.getInstance().sendIntroS1P7Command(pipUUID)

		res.status(200).json({ success: "Intro S1 P7 triggered" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to trigger intro S1 P7" } satisfies ErrorResponse)
		return
	}
}
