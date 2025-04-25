import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default async function stopCurrentlyRunningSandboxCode(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		await SendEsp32MessageManager.getInstance().stopCurrentlyRunningSandboxCode(pipUUID)

		res.status(200).json({ success: "Stopped currently running sandbox code" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to stop currently running sandbox code" })
		return
	}
}
