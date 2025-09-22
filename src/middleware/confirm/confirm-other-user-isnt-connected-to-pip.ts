import { Request, Response, NextFunction } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

export default function confirmOtherUserIsntConnectedToPip(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const userIdConnectToPip = Esp32SocketManager.getInstance().getUserIdConnectedToOnlinePip(pipUUID)

		if (userIdConnectToPip === userId) {
			res.status(200).json({ success: "You are already connected to this Pip" } satisfies SuccessResponse)
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
