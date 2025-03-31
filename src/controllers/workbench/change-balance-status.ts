import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function changeBalanceStatus(req: Request, res: Response): Promise<void> {
	try {
		const { balanceStatus, pipUUID } = req.body as { balanceStatus: boolean, pipUUID: PipUUID }

		await Esp32SocketManager.getInstance().emitChangeBalanceStatus(balanceStatus, pipUUID)

		res.status(200).json({ success: "" })
		return
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change balance status" })
		return
	}
}
