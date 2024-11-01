import { Response, Request } from "express"
import addUserPipUUIDMapRecord from "../../db-operations/write/user-pip-uuid-map/add-user-pip-uuid-map-record"

// TODO: When a user initially adds their Pip,
//it should automatically try to connect the client to the Pip without having to hit this endpoint.
// On add-pip-to-account, it should check if the added pipUUID is currently connected to the internet
// If so, it should automatially connect the user.
export default async function addPipToAccount (req: Request, res: Response): Promise<void> {
	try {
		const { user, pipUUIDData } = req
		const { pipName } = req.body.addPipToAccountData as { pipName: string }
		const userPipUUIDId = await addUserPipUUIDMapRecord(
			user.user_id,
			pipName,
			pipUUIDData.pip_uuid_id
		)

		res.status(200).json({ userPipUUIDId })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add Pip to account" })
		return
	}
}
