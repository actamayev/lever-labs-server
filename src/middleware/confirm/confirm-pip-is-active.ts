import { Request, Response, NextFunction } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID , ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"

export default function confirmPipIsActive(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const isPipUUIDConnected = Esp32SocketManager.getInstance().isPipUUIDConnected(pipUUID)

		if (isPipUUIDConnected === false) {
			res.status(400).json({ message: "This Pip is not active/connected to the internet"} as MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm Pip is connected to the internet" } as ErrorResponse)
		return
	}
}
