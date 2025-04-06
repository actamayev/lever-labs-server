import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function displayLights(req: Request, res: Response): Promise<void> {
	try {
		const { lightStatus, pipUUID } = req.body as { lightStatus: LightStatus, pipUUID: PipUUID }
		console.log(lightStatus)

		await Esp32SocketManager.getInstance().emitLightStatus(pipUUID, lightStatus)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to display lights" })
		return
	}
}
