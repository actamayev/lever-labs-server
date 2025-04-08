import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

// This is an internal route to not have to go through the WS in Postman
export default async function displayLedColorsDirectly (req: Request, res: Response): Promise<void> {
	try {
		const body = req.body as IncomingNewLedControlData

		await Esp32SocketManager.getInstance().emitNewLedColorsToPip(body.pipUUID, body)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change led colors" })
		return
	}
}
