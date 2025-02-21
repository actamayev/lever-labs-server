import isNull from "lodash/isNull"
import { Request, Response, NextFunction } from "express"
import findActivityIdFromUUID from "../../db-operations/read/find/find-activity-id-from-uuid"

export default async function attachActivityIdFromUUID(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { activityUUID } = req.params as { activityUUID: ActivityUUID }

		const activityId = await findActivityIdFromUUID(activityUUID)

		if (isNull(activityId)) {
			res.status(400).json({ message: "Activity ID doesn't exist"})
			return
		}

		req.activityId = activityId

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm New Pip UUID Exists" })
		return
	}
}
