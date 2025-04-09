import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function lightAnimationEndpoint(req: Request, res: Response): Promise<void> {
	try {
		const { lightAnimation, pipUUID } = req.body as { lightAnimation: LightAnimation, pipUUID: PipUUID }

		await Esp32SocketManager.getInstance().emitLightAnimation(pipUUID, lightAnimation)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to display light animation" })
		return
	}
}
