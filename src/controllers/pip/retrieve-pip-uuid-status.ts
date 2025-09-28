
import { Response, Request } from "express"
import doesPipUUIDExist from "../../db-operations/read/does-x-exist/does-pip-uuid-exist"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import { ErrorResponse, RetrieveIsPipUUIDValidResponse, MessageResponse} from "@lever-labs/common-ts/types/api"
import espConnectionStateToClientConnectionStatus from "../../utils/pip/esp-connection-state-to-client-connection-status"

export default async function retrievePipUUIDStatus(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const isFound = await doesPipUUIDExist(pipUUID)

		if (!isFound) {
			res.status(400).json({
				message: "Looks like that Pip ID doesn't exist. Could you please check your Pip ID and try again?"
			} satisfies MessageResponse)
			return
		}

		// Get ESP status and convert to user-relative format for API response
		const { userId } = req
		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)
		const pipConnectionStatus = espConnectionStateToClientConnectionStatus(espStatus, userId)

		res.status(200).json({ pipName: "Pip", pipConnectionStatus } satisfies RetrieveIsPipUUIDValidResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve PipUUID status" } satisfies ErrorResponse)
		return
	}
}
