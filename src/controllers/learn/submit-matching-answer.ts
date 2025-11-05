import { Response, Request } from "express"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"
import { ErrorResponse, CheckMatchingSelectionResponse } from "@lever-labs/common-ts/types/api"
import checkMatchingAnswer from "../../db-operations/read/matching/check-matching-answer"
import addMatchingUserAnswer from "../../db-operations/write/user-answer/add-matching-user-answer"

export default async function submitMatchingAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { questionId } = req.params as { questionId: QuestionUUID }
		const { codingBlockId, matchingAnswerChoiceTextId } = req.body as {
			codingBlockId: number
			matchingAnswerChoiceTextId: number
		}

		const isCorrect = await checkMatchingAnswer(questionId, codingBlockId, matchingAnswerChoiceTextId)

		await addMatchingUserAnswer(userId, matchingAnswerChoiceTextId, codingBlockId, isCorrect)

		res.status(200).json({ isCorrect } satisfies CheckMatchingSelectionResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit matching answer" } satisfies ErrorResponse)
		return
	}
}
