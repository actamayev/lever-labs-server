import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { PipUUID, ErrorResponse, SuccessResponse, MessageResponse} from "@bluedotrobots/common-ts"

export default function confirmOtherUserIsntConnectedToPip(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const userIdConnectToPip = BrowserSocketManager.getInstance().whichUserConnectedToPipUUID(pipUUID)

		if (userIdConnectToPip === userId) {
			res.status(200).json({ success: "You are already connected to this Pip" } satisfies SuccessResponse)
			return
		} else if (!isUndefined(userIdConnectToPip)) {
			res.status(400).json({ message: "Someone is already connected to this Pip"} as MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to confirm another user isn't connected to this Pip" } satisfies ErrorResponse
		)
		return
	}
}
