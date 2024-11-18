import _ from "lodash"
import { Request, Response, NextFunction } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function confirmOtherUserIsntConnectedToPip(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { user } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const userId = BrowserSocketManager.getInstance().whichUserConnectedToPipUUID(pipUUID)

		if (userId === user.user_id) {
			res.status(200).json({ success: "You are already connected to this Pip" })
			return
		} else if (!_.isUndefined(userId)) {
			res.status(400).json({ message: "Someone is already connected to this Pip"})
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm another user isn't connected to this Pip" })
		return
	}
}
