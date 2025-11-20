import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"

export default function pipTurningOffSerialConnection(req: Request, res: Response): void {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		Esp32SocketManager.getInstance().handleCommandDisconnection(pipUUID, true)

		res.status(200).json({ success: "Successfully shutting down Pip" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to shut down Pip" } satisfies ErrorResponse)
		return
	}
}
