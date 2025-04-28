import { Response, Request } from "express"
import retrieveQuestionsFromActivity from "../../db-operations/read/activity/retrieve-questions-from-activity"
import { ErrorResponse } from "@bluedotrobots/common-ts"
export default async function retrieveQuizAttempts(req: Request, res: Response): Promise<void> {
	try {
		const { userId, activityId } = req
		const quizAttempts = await retrieveQuestionsFromActivity(userId, activityId)

		res.status(200).json({ quizAttempts })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve quizzes and attempts" } as ErrorResponse)
		return
	}
}
