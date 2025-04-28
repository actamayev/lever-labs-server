import isNull from "lodash/isNull"
import { Response, Request } from "express"
import findPipUUID from "../../db-operations/read/find/find-pip-uuid"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@bluedotrobots/common-ts"

export default async function retrievePipUUIDStatus(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.params as { pipUUID: PipUUID }

		const pipUUIDData = await findPipUUID(pipUUID)

		if (isNull(pipUUIDData)) {
			res.status(400).json({ message: "Pip UUID doesn't exist"})
			return
		}

		const pipConnectionStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUID)

		res.status(200).json({ pipName: pipUUIDData.pip_name, pipConnectionStatus })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve PipUUID status" })
		return
	}
}
