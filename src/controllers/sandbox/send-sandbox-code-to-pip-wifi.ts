import { Response, Request } from "express"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { MessageBuilder } from "@actamayev/lever-labs-common-ts/message-builder"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default async function sendSandboxCodeToPipWifi(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }
		const { bytecode } = req

		await SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createBytecodeMessage(bytecode)
		)

		res.status(200).json({ success: "Sandbox code sent to Pip" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to send sandbox code to Pip" } satisfies ErrorResponse)
		return
	}
}
