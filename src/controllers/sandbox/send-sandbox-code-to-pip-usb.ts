import { Response, Request } from "express"
import { ErrorResponse, UsbBytecodeResponse } from "@lever-labs/common-ts/types/api"
import { checkForMotorCommands, checkForStartButton } from "../../utils/sandbox/sandbox-safety-measures"

export default function sendSandboxCodeToPipUsb(req: Request, res: Response): void {
	try {
		const { bytecode } = req

		const hasMotorCommands = checkForMotorCommands(bytecode)
		const hasStartButton = checkForStartButton(bytecode)
		const isAbleToRunViaUsb = !(hasMotorCommands && !hasStartButton)

		res.status(200).json({ bytecode, isAbleToRunViaUsb } satisfies UsbBytecodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to compile sandbox code to bytecode" } satisfies ErrorResponse)
		return
	}
}
