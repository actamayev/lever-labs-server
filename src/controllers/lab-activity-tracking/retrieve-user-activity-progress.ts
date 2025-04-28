import { Response, Request } from "express"
import { UserActivityProgress } from "@bluedotrobots/common-ts"
import retrieveUserActivityProgressDB from "../../db-operations/read/user-activity-progress/retrieve-user-activity-progress-db"

export default async function retrieveUserActivityProgress(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req

		const userActivityProgress = await retrieveUserActivityProgressDB(userId)

		res.status(200).json({ userActivityProgress } as { userActivityProgress: UserActivityProgress[] })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve user activity progress" })
		return
	}
}
