import { Response, Request } from "express"
import { ErrorResponse, CheckAnswerResponse } from "@lever-labs/common-ts/types/api"
import addBlockToFunctionUserAnswer from "../../db-operations/write/user-answer/add-block-to-function-user-answer"
import checkBlockToFunctionAnswerChoice from "../../db-operations/read/block-to-function/check-block-to-function-answer-choice"

export default async function submitBlockToFunctionAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { answerChoiceId } = req.body as { answerChoiceId: number }

		await addBlockToFunctionUserAnswer(userId, answerChoiceId)
		const isCorrect = await checkBlockToFunctionAnswerChoice(answerChoiceId)

		res.status(200).json({ isCorrect } satisfies CheckAnswerResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit block to function answer" } satisfies ErrorResponse)
		return
	}
}
