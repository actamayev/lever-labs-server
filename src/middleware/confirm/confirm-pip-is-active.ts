import { Request, Response, NextFunction } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { ErrorResponse, MessageResponse } from "@actamayev/lever-labs-common-ts/types/api"

export default function confirmPipIsActive(confirmUserConnectedToPip: boolean) {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			const { pipUUID } = req.body as { pipUUID: PipUUID }

			const isPipActive = Esp32SocketManager.getInstance().isPipUUIDConnected(pipUUID)
			if (!isPipActive) {
				res.status(400).json({ message: "This Pip is not active/connected to the internet" } satisfies MessageResponse)
				return
			}

			if (confirmUserConnectedToPip) {
				const { userId } = req
				const isUserConnectedToPip = Esp32SocketManager.getInstance().getIsUserIdConnectedToOnlinePip(pipUUID, userId)
				if (!isUserConnectedToPip) {
					res.status(400).json({ message: "This Pip is not active/connected to this user" } satisfies MessageResponse)
					return
				}
			}

			next()
		} catch (error) {
			console.error(error)
			res.status(500).json({
				error: "Internal Server Error: Unable to confirm Pip is connected to the internet"
			} satisfies ErrorResponse)
			return
		}
	}
}
