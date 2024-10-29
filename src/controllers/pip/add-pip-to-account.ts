import { Response, Request } from "express"
import addUserPipUUIDMapRecord from "../../db-operations/write/user-pip-uuid-map/add-user-pip-uuid-map-record"

export default async function addPipToAccount (req: Request, res: Response): Promise<void> {
	try {
		const { user, pipUUIDData } = req
		const { pipName } = req.body.addPipToAccountData as { pipName: string }
		await addUserPipUUIDMapRecord(
			user.user_id,
			pipName,
			pipUUIDData.pip_uuid_id
		)


		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add Pip to account" })
		return
	}
}
