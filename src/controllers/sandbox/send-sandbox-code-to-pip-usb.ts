import { Response, Request } from "express"
import { ErrorResponse, UsbBytecodeResponse } from "@lever-labs/common-ts/types/api"
import { Base64String } from "@lever-labs/common-ts/types/utils"
import { checkForMotorCommands, checkForStartButton } from "../../utils/sandbox/sandbox-safety-measures"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"

export default function sendSandboxCodeToPipUsb(req: Request, res: Response): void {
	try {
		const { bytecode } = req

		const hasMotorCommands = checkForMotorCommands(bytecode)
		const hasStartButton = checkForStartButton(bytecode)
		const isAbleToRunViaUsb = !(hasMotorCommands && !hasStartButton)

		const buffer = MessageBuilder.createBytecodeMessage(bytecode)
		const bytecodeBase64 = Buffer.from(buffer).toString("base64") as Base64String

		res.status(200).json({ bytecode: bytecodeBase64, isAbleToRunViaUsb } satisfies UsbBytecodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to compile sandbox code to bytecode" } satisfies ErrorResponse)
		return
	}
}
