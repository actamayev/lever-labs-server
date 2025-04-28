import { Request, Response, NextFunction } from "express"
import doesUUIDIdUserRecordExist from "../../db-operations/read/does-x-exist/does-uuid-id-user-record-exist"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"

export default async function confirmUserHasntAlreadyAddedUUID(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId, pipUUIDData } = req

		const uuidUserRecord = await doesUUIDIdUserRecordExist(userId, pipUUIDData.pip_uuid_id)

		if (uuidUserRecord === true) {
			res.status(400).json({ message: "User already registered this Pip UUID" } as MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to confirm user hasn't already registered this pip UUID" } as ErrorResponse
		)
		return
	}
}
