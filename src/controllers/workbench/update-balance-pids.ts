import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default async function updateBalancePids(req: Request, res: Response): Promise<void> {
	try {
		const body = req.body as BalancePidsProps

		await SendEsp32MessageManager.getInstance().changeBalancePids(body)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update balance Pids" })
		return
	}
}
