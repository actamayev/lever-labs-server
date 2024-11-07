import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32-socket-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import espStatusToPipConnectionStatus from "../../utils/esp-status-to-pip-connection-status"
import addUserPipUUIDMapRecord from "../../db-operations/write/user-pip-uuid-map/add-user-pip-uuid-map-record"

export default async function addPipToAccount(req: Request, res: Response): Promise<void> {
	try {
		const { user, pipUUIDData } = req
		const { pipName, shouldAutoConnect } = req.body.addPipToAccountData as { pipName: string, shouldAutoConnect: boolean }
		const userPipUUIDId = await addUserPipUUIDMapRecord(
			user.user_id,
			pipName,
			pipUUIDData
		)

		const espStatus = Esp32SocketManager.getInstance().getESPStatus(pipUUIDData.uuid)

		const pipConnectionStatus = espStatusToPipConnectionStatus(espStatus, pipUUIDData.uuid, shouldAutoConnect)

		BrowserSocketManager.getInstance().addPipStatusToAccount(user.user_id, pipUUIDData.uuid, pipConnectionStatus)

		res.status(200).json({ userPipUUIDId, pipConnectionStatus })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add Pip to account" })
		return
	}
}
