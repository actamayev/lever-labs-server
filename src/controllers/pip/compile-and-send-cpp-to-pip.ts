import { Response, Request } from "express"
import compileUserCode from "../../utils/cpp/send-cpp-to-docker"
import Esp32SocketManager from "../../classes/esp32-socket-manager"

export default async function compileAndSendCppToPip(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, cppCode } = req.body as { pipUUID: PipUUID, cppCode: string }

		const compiledUserCode = await compileUserCode(cppCode)

		Esp32SocketManager.getInstance().emitBinaryCodeToPip(pipUUID, compiledUserCode)

		res.status(200).json({ success: "Sent code to Pip" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to compile and send Pip the code" })
		return
	}
}
