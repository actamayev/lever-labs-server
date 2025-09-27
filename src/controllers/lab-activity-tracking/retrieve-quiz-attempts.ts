import { Response, Request } from "express"
import retrieveQuestionsFromActivity from "../../db-operations/read/activity/retrieve-questions-from-activity"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"
import { RetrievedQuestions } from "@lever-labs/common-ts/types/lab"

export default async function retrieveQuizAttempts(req: Request, res: Response): Promise<void> {
	try {
		const { userId, activityId } = req
		const quizAttempts = await retrieveQuestionsFromActivity(userId, activityId)

		res.status(200).json({ quizAttempts } satisfies { quizAttempts: RetrievedQuestions[] })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve quizzes and attempts" } satisfies ErrorResponse)
		return
	}
}
