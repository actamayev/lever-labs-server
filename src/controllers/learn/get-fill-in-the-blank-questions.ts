import { Response, Request } from "express"
import getFillInTheBlankQuestionsDb from "../../db-operations/read/lesson/get-fill-in-the-blank-questions-db"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"

export default async function getFillInTheBlankQuestions(req: Request, res: Response): Promise<void> {
	try {
		const { lessonId } = req

		const questions = await getFillInTheBlankQuestionsDb(lessonId)

		res.status(200).json({ questions } satisfies QuestionsResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve fill in the blank questions" } satisfies ErrorResponse)
		return
	}
}
