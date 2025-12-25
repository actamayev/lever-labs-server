import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { BalancePidsProps } from "@actamayev/lever-labs-common-ts/types/garage"
import { MessageBuilder } from "@actamayev/lever-labs-common-ts/message-builder"

export default function updateBalancePids(req: Request, res: Response): void {
	try {
		const body = req.body as BalancePidsProps

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			body.pipUUID,
			MessageBuilder.createUpdateBalancePidsMessage(body)
		)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update balance Pids" } satisfies ErrorResponse)
		return
	}
}
