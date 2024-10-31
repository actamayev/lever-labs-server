import { Response, Request } from "express"
import retrieveUserPipUUIDs from "../../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids"

export default async function retrievePreviouslyAddedPips (req: Request, res: Response): Promise<void> {
	try {
		const { user } = req
		const userPipData = await retrieveUserPipUUIDs(user.user_id)

		res.status(200).json({ userPipData })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retreive previously added Pips" })
		return
	}
}
