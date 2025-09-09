import { Response, Request } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts/types/api"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

export default function clientConnectToPipRequest (req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		BrowserSocketManager.getInstance().addPipStatusToAccount(userId, pipUUID, "connected")

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to connect to Pip" } satisfies ErrorResponse)
		return
	}
}
