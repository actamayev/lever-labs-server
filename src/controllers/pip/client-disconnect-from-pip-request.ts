import { Response, Request } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { PipUUID , ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default function clientDisconnectFromPipRequest (req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		BrowserSocketManager.getInstance().addPipStatusToAccount(userId, pipUUID, "online")

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to disconnect from Pip" } as ErrorResponse)
		return
	}
}
