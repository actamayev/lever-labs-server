import { Response, Request } from "express"
import doesPipUUIDExist from "../../db-operations/read/does-x-exist/does-pip-uuid-exist"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { ErrorResponse, RetrieveIsPipUUIDValidResponse, MessageResponse} from "@bluedotrobots/common-ts/types/api"

export default async function retrievePipUUIDStatus(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const isFound = await doesPipUUIDExist(pipUUID)

		if (!isFound) {
			res.status(400).json({ message: "Pip UUID doesn't exist" } satisfies MessageResponse)
			return
		}

		const pipConnectionStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)

		res.status(200).json({ pipName: "Pip", pipConnectionStatus } satisfies RetrieveIsPipUUIDValidResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve PipUUID status" } satisfies ErrorResponse)
		return
	}
}
