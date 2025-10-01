import { Response, Request } from "express"
import markActivityCompleteDb from "../../db-operations/write/user-activity-progress/mark-activity-complete-db"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import { ActivityUUID } from "@lever-labs/common-ts/types/lab"

export default async function markActivityComplete(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { activityId } = req.params as { activityId: ActivityUUID }

		await markActivityCompleteDb(userId, activityId)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve user activity progress" } satisfies ErrorResponse)
		return
	}
}
