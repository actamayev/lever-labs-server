import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function playTune (req: Request, res: Response): Promise<void> {
	try {
		const { tuneToPlay, pipUUID } = req.body as { tuneToPlay: TuneToPlay, pipUUID: PipUUID }

		await Esp32SocketManager.getInstance().emitTuneToPlay(pipUUID, tuneToPlay)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to play tune" })
		return
	}
}
