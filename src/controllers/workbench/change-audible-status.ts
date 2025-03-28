import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function changeAudibleStatus(req: Request, res: Response): Promise<void> {
	try {
		const { audibleStatus, pipUUID } = req.body as { audibleStatus: boolean, pipUUID: PipUUID }

		await Esp32SocketManager.getInstance().emitChangeAudibleStatus(audibleStatus, pipUUID)

		res.status(200).json({ success: "" })
		return
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change audible status" })
		return
	}
}
