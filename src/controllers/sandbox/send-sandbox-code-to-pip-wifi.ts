import { Response, Request } from "express"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import { ErrorResponse, WiFiBytecodeResponse } from "@lever-labs/common-ts/types/api"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default async function sendSandboxCodeToPipWifi(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }
		const { bytecode } = req

		await SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createBytecodeMessage(bytecode)
		)

		res.status(200).json({ bytecode } satisfies WiFiBytecodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to send bytecode to Pip" } satisfies ErrorResponse)
		return
	}
}
