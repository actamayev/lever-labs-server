import isUndefined from "lodash-es/isUndefined"
import { Request, Response, NextFunction } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function confirmUserConnectedToPip(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { user } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const connectedUserId = BrowserSocketManager.getInstance().whichUserConnectedToPipUUID(pipUUID)

		if (isUndefined(connectedUserId)) {
			BrowserSocketManager.getInstance().addPipStatusToAccount(user.user_id, pipUUID, "connected")
			next()
			return
		}

		if (connectedUserId !== user.user_id) {
			res.status(400).json({ message: "Another user is connected to this Pip"})
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user is connected to this Pip" })
		return
	}
}
