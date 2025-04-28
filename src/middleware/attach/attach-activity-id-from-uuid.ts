import isNull from "lodash/isNull"
import { Request, Response, NextFunction } from "express"
import findActivityIdFromUUID from "../../db-operations/read/find/find-activity-id-from-uuid"
import { ActivityUUID, ErrorResponse , MessageResponse} from "@bluedotrobots/common-ts"

export default async function attachActivityIdFromUUID(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { readingUUID } = req.params as { readingUUID: ActivityUUID }

		const activityId = await findActivityIdFromUUID(readingUUID)

		if (isNull(activityId)) {
			res.status(400).json({ message: "Activity ID doesn't exist"})
			return
		}

		req.activityId = activityId

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to attach activity Id from UUID" } as ErrorResponse)
		return
	}
}
