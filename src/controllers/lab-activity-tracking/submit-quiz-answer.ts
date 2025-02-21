import { Response, Request } from "express"
import submitQuestionAnswerDb from "../../db-operations/write/user-answer/submit-question-answer-db"

export default async function submitQuizAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { readingQuestionAnswerChoiceId } = req.params

		await submitQuestionAnswerDb(userId, Number(readingQuestionAnswerChoiceId))

		res.status(200).json({ success: "" })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit quiz answer" })
		return
	}
}
