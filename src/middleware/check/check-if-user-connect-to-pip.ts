import { Request, Response, NextFunction } from "express"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { ErrorResponse, MessageResponse} from "@actamayev/lever-labs-common-ts/types/api"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { isUndefined } from "lodash"

export default function checkIfUserConnectedToPip(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const connectedUserId = Esp32SocketManager.getInstance().getUserIdConnectedToOnlinePip(pipUUID)

		if (isUndefined(connectedUserId)) {
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
		res.status(500).json({ error: "Internal Server Error: Unable to check if user is connected to this Pip" } satisfies ErrorResponse)
		return
	}
}
