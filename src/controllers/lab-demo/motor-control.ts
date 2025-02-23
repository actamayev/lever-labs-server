import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

// TODO: Delete this file
export default async function motorControl(req: Request, res: Response): Promise<void> {
	try {
		const { motorControlData } = req.body as { motorControlData: IncomingMotorControlData }

		await Esp32SocketManager.getInstance().emitMotorControlToPip(motorControlData)

		res.status(200).json({ success: "" })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to control motor" })
		return
	}
}
