import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { ErrorResponse, MessageResponse } from "@bluedotrobots/common-ts/types/api"

export default function confirmUserConnectedToPip(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const connectedUserId = BrowserSocketManager.getInstance().whichUserConnectedToPipUUID(pipUUID)

		if (isUndefined(connectedUserId)) {
			// Get current ESP status and set user as connected
			res.status(400).json({ message: "No user is connected to this Pip" } satisfies MessageResponse)
			return
		}

		if (connectedUserId !== userId) {
			res.status(400).json({ message: "Another user is connected to this Pip" } satisfies MessageResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user is connected to this Pip" } satisfies ErrorResponse)
		return
	}
}
