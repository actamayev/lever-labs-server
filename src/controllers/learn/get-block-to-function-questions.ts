import { Response, Request } from "express"
import getBlockToFunctionQuestionsDb from "../../db-operations/read/lesson/get-block-to-function-questions-db"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"

export default async function getBlockToFunctionQuestions(req: Request, res: Response): Promise<void> {
	try {
		const { lessonId } = req

		const questions = await getBlockToFunctionQuestionsDb(lessonId)

		res.status(200).json({ questions } satisfies QuestionsResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve block to function questions" } satisfies ErrorResponse)
		return
	}
}
