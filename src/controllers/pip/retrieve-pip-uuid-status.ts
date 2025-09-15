
import { Response, Request } from "express"
import doesPipUUIDExist from "../../db-operations/read/does-x-exist/does-pip-uuid-exist"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { ClientPipConnectionStatus } from "@bluedotrobots/common-ts/types/pip"
import { ErrorResponse, RetrieveIsPipUUIDValidResponse, MessageResponse} from "@bluedotrobots/common-ts/types/api"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default async function retrievePipUUIDStatus(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const isFound = await doesPipUUIDExist(pipUUID)

		if (!isFound) {
			res.status(400).json({ message: "Pip UUID doesn't exist" } satisfies MessageResponse)
			return
		}

		// Get ESP status and convert to user-relative format for API response
		const { userId } = req
		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)

		let pipConnectionStatus: ClientPipConnectionStatus
		if (espStatus.connectedToSerial) {
			pipConnectionStatus = "connected to serial"
		} else if (!espStatus.online) {
			pipConnectionStatus = "offline"
		} else if (espStatus.connectedToOnlineUser) {
			// Check if the requesting user is the one connected
			const connectedUserId = BrowserSocketManager.getInstance().whichUserConnectedToPipUUID(pipUUID)
			pipConnectionStatus = connectedUserId === userId ? "connected to you" : "connected to another user"
		} else {
			// Just online, available for connection
			pipConnectionStatus = "online"
		}

		res.status(200).json({ pipName: "Pip", pipConnectionStatus } satisfies RetrieveIsPipUUIDValidResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve PipUUID status" } satisfies ErrorResponse)
		return
	}
}
