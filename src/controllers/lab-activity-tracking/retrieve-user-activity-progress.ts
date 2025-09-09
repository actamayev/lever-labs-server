import { Response, Request } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts/types/api"
import { UserActivityProgress } from "@bluedotrobots/common-ts/types/lab"
import retrieveUserActivityProgressDB from "../../db-operations/read/user-activity-progress/retrieve-user-activity-progress-db"

export default async function retrieveUserActivityProgress(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req

		const userActivityProgress = await retrieveUserActivityProgressDB(userId)

		res.status(200).json({ userActivityProgress } satisfies { userActivityProgress: UserActivityProgress[] })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve user activity progress" } satisfies ErrorResponse)
		return
	}
}
