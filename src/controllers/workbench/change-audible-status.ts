import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function changeAudibleStatus(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, audibleStatus } = req.body as { pipUUID: PipUUID, audibleStatus: boolean }

		await Esp32SocketManager.getInstance().emitChangeAudibleStatus(pipUUID, audibleStatus)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change audible status" })
		return
	}
}
