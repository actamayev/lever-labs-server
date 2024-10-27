import { Request, Response, NextFunction } from "express"
import doesUUIDUserRecordExist from "../../db-operations/read/does-x-exist/does-uuid-user-record-exist"

export default async function confirmUserHasntAlreadyAddedUUID(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { user } = req
		const { pipUUIDData } = req

		const uuidUserRecord = await doesUUIDUserRecordExist(user.user_id, pipUUIDData.pip_uuid_id)

		if (uuidUserRecord === true) {
			res.status(500).json({ error: "User already registered this Pip UUID"})
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user hasn't already registered this pip UUID" })
	}
}
