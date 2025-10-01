import { Response, Request } from "express"
import getFunctionToBlockQuestionsDb from "../../db-operations/read/lesson/get-function-to-block-questions-db"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"

export default async function getFunctionToBlockQuestions(req: Request, res: Response): Promise<void> {
	try {
		const { lessonId } = req

		const questions = await getFunctionToBlockQuestionsDb(lessonId)

		res.status(200).json({ questions } satisfies QuestionsResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve function to block questions" } satisfies ErrorResponse)
		return
	}
}
