import { Response, Request } from "express"
import markActivityCompleteDb from "../../db-operations/write/user-activity-progress/mark-activity-complete-db"

export default async function markActivityComplete(req: Request, res: Response): Promise<void> {
	try {
		const { userId, activityId } = req

		const userActivityProgress = await markActivityCompleteDb(userId, activityId)

		res.status(200).json({ userActivityProgress })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve user activity progress" })
		return
	}
}
