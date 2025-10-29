import { Response, Request } from "express"
import { ErrorResponse, CheckAnswerResponse } from "@lever-labs/common-ts/types/api"
import addFunctionToBlockUserAnswer from "../../db-operations/write/user-answer/add-function-to-block-user-answer"
import checkFunctionToBlockAnswerChoice from "../../db-operations/read/function-to-block/check-function-to-block-answer-choice"

export default async function submitFunctionToBlockAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { answerChoiceId } = req.body as { answerChoiceId: number }

		await addFunctionToBlockUserAnswer(userId, answerChoiceId)
		const isCorrect = await checkFunctionToBlockAnswerChoice(answerChoiceId)

		res.status(200).json({ isCorrect } satisfies CheckAnswerResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit function to block answer" } satisfies ErrorResponse)
		return
	}
}
