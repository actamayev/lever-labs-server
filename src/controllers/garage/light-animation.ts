import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { LightAnimation, PipUUID } from "@bluedotrobots/common-ts"

export default async function lightAnimationEndpoint(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID, lightAnimation } = req.body as { pipUUID: PipUUID, lightAnimation: LightAnimation }

		await SendEsp32MessageManager.getInstance().displayLights(pipUUID, lightAnimation)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to display light animation" })
		return
	}
}
