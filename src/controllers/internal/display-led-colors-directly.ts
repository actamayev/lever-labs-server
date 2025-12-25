import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { LedControlData } from "@actamayev/lever-labs-common-ts/types/garage"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { MessageBuilder } from "@actamayev/lever-labs-common-ts/message-builder"

// This is an internal route to not have to go through the WS in Postman
export default function displayLedColorsDirectly(req: Request, res: Response): void {
	try {
		const body = req.body as LedControlData

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(body.pipUUID, MessageBuilder.createLedMessage(body))

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change led colors" } satisfies ErrorResponse)
		return
	}
}
