import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

// This is an internal route to not have to go through the WS in Postman
export default async function displayLedColorsDirectly (req: Request, res: Response): Promise<void> {
	try {
		const body = req.body as IncomingNewLedControlData

		await SendEsp32MessageManager.getInstance().transferLedControlData(body)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change led colors" })
		return
	}
}
