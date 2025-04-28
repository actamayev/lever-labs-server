import { Request, Response, NextFunction } from "express"
import doesUUIDUserRecordExist from "../../db-operations/read/does-x-exist/does-uuid-user-record-exist"
import { ErrorResponse, PipUUID } from "@bluedotrobots/common-ts"

export default async function confirmUserPreviouslyAddedUUID(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const uuidUserRecord = await doesUUIDUserRecordExist(userId, pipUUID)

		if (uuidUserRecord === false) {
			res.status(400).json({ message: "User hasn't registered this UUID"})
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user hasn't already registered this pip UUID" } as ErrorResponse)
		return
	}
}
