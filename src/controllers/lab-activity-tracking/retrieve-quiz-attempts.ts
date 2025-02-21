import { Response, Request } from "express"
import retrieveQuestionsFromActivity from "../../db-operations/read/activity/retrieve-questions-from-activity"

export default async function retrieveQuizAttempts(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { activityUUID } = req.body as { activityUUID: ActivityUUID }

		const quizAttempts = await retrieveQuestionsFromActivity(userId, activityUUID)

		res.status(200).json({ quizAttempts })
		return
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve quizzes and attempts" })
		return
	}
}
