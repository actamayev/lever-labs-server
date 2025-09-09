import { Response, Request } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts/types/api"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

export default function clientDisconnectFromPipRequest (req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		BrowserSocketManager.getInstance().addPipStatusToAccount(userId, pipUUID, "online")

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to disconnect from Pip" } satisfies ErrorResponse)
		return
	}
}
