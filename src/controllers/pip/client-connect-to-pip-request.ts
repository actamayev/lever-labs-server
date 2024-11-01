import { Response, Request } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function clientConnectToPipRequest (req: Request, res: Response): void {
	try {
		const { user } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		BrowserSocketManager.getInstance().emitPipStatusUpdateForUser(pipUUID, user.user_id)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to connect to Pip" })
		return
	}
}
