import { Response, Request } from "express"
import { CheckMCQResponse, ErrorResponse } from "@lever-labs/common-ts/types/api"
import addBlockToFunctionUserAnswer from "../../db-operations/write/user-answer/add-block-to-function-user-answer"
import getCorrectBlockToFunctionAnswerChoiceId from "../../db-operations/read/block-to-function/check-block-to-function-answer-choice"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

export default async function submitBlockToFunctionAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { answerChoiceId, blockToFunctionFlashcardId } = req.body as {
			answerChoiceId: number
			blockToFunctionFlashcardId: QuestionUUID
		}

		await addBlockToFunctionUserAnswer(userId, answerChoiceId)
		const correctAnswerChoiceId = await getCorrectBlockToFunctionAnswerChoiceId(blockToFunctionFlashcardId)

		res.status(200).json({ correctAnswerId: correctAnswerChoiceId } satisfies CheckMCQResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit block to function answer" } satisfies ErrorResponse)
		return
	}
}
