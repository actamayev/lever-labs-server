import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function sendSandboxCodeToPip(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }
		const { bytecode } = req

		await Esp32SocketManager.getInstance().emitBytecodeToPip(pipUUID, bytecode)

		res.status(200).json({ success: "Sent bytecode to Pip" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to send bytecode to Pip" })
		return
	}
}
