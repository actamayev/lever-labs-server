import { Response, Request } from "express"
import { ErrorResponse, CheckMCQResponse } from "@lever-labs/common-ts/types/api"
import addFunctionToBlockUserAnswer from "../../db-operations/write/user-answer/add-function-to-block-user-answer"
import getCorrectFunctionToBlockAnswerChoiceId from "../../db-operations/read/function-to-block/check-function-to-block-answer-choice"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

export default async function submitFunctionToBlockAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { answerChoiceId, functionToBlockFlashcardId } = req.body as {
			answerChoiceId: number
			functionToBlockFlashcardId: QuestionUUID
		}

		await addFunctionToBlockUserAnswer(userId, answerChoiceId)
		const correctAnswerChoiceId = await getCorrectFunctionToBlockAnswerChoiceId(functionToBlockFlashcardId)

		res.status(200).json({ correctAnswerId: correctAnswerChoiceId } satisfies CheckMCQResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit function to block answer" } satisfies ErrorResponse)
		return
	}
}
