import isUndefined from "lodash/isUndefined"
import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import espStatusToPipConnectionStatus from "../../utils/esp-status-to-pip-connection-status"
import addUserPipUUIDMapRecord from "../../db-operations/write/user-pip-uuid-map/add-user-pip-uuid-map-record"

export default async function addPipToAccount(req: Request, res: Response): Promise<void> {
	try {
		const { userId, pipUUIDData } = req
		const { shouldAutoConnect } = req.body.addPipToAccountData as { shouldAutoConnect: boolean }
		let { pipName } = req.body.addPipToAccountData as { pipName?: string }
		const userPipUUIDId = await addUserPipUUIDMapRecord(
			userId,
			pipUUIDData,
			pipName
		)

		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUIDData.uuid)

		const pipConnectionStatus = espStatusToPipConnectionStatus(espStatus, pipUUIDData.uuid, userId, shouldAutoConnect)

		BrowserSocketManager.getInstance().addPipStatusToAccount(userId, pipUUIDData.uuid, pipConnectionStatus)

		if (isUndefined(pipName)) pipName = pipUUIDData.pip_name || ""

		res.status(200).json({ pipName, userPipUUIDId, pipConnectionStatus })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add Pip to account" })
		return
	}
}
