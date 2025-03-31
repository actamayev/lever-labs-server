import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function updateBalancePids(req: Request, res: Response): Promise<void> {
	try {
		const body = req.body as BalancePidsProps

		await Esp32SocketManager.getInstance().emitChangeBalancePids(body)

		res.status(200).json({ success: "" })
		return
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update balance Pids" })
		return
	}
}
