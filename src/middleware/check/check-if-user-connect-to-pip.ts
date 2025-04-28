import { Request, Response, NextFunction } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { PipUUID , ErrorResponse} from "@bluedotrobots/common-ts"

export default function checkIfUserConnectedToPip(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const connectedUserId = BrowserSocketManager.getInstance().whichUserConnectedToPipUUID(pipUUID)

		if (connectedUserId !== userId) {
			res.status(400).json({ message: "Another user is connected to this Pip"})
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to check if user is connected to this Pip" } as ErrorResponse)
		return
	}
}
