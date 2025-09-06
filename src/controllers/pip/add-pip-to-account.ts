import isUndefined from "lodash/isUndefined"
import { Response, Request } from "express"
import { AddNewPipResponse, ErrorResponse } from "@bluedotrobots/common-ts"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import addUserPipUUIDMapRecord from "../../db-operations/write/user-pip-uuid-map/add-user-pip-uuid-map-record"

export default async function addPipToAccount(req: Request, res: Response): Promise<void> {
	try {
		const { userId, pipUUIDData } = req
		let { pipName } = req.body.addPipToAccountData as { pipName?: string }
		const userPipUUIDId = await addUserPipUUIDMapRecord(
			userId,
			pipUUIDData,
			pipName
		)

		BrowserSocketManager.getInstance().addPipStatusToAccount(userId, pipUUIDData.uuid, "connected")

		if (isUndefined(pipName)) pipName = pipUUIDData.pip_name || ""

		res.status(200).json({ pipName, userPipUUIDId } satisfies AddNewPipResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add Pip to account" } satisfies ErrorResponse)
		return
	}
}
