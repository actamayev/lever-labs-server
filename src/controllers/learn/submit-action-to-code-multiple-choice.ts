import { Response, Request } from "express"
import { ErrorResponse, CheckMCQResponse } from "@lever-labs/common-ts/types/api"
import addActionToCodeMultipleChoiceUserAnswer from "../../db-operations/write/user-answer/add-action-to-code-multiple-choice-user-answer"
import getCorrectActionToCodeMultipleChoiceAnswerChoiceId
	from "../../db-operations/read/action-to-code/check-action-to-code-multiple-choice-answer-choice"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

export default async function submitActionToCodeMultipleChoiceAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { questionId } = req.params as { questionId: QuestionUUID }
		const { answerChoiceId } = req.body as { answerChoiceId: number }

		await addActionToCodeMultipleChoiceUserAnswer(userId, answerChoiceId)

		const correctAnswerChoiceId = await getCorrectActionToCodeMultipleChoiceAnswerChoiceId(questionId)

		res.status(200).json({ correctAnswerId: correctAnswerChoiceId } satisfies CheckMCQResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to submit action to code multiple choice answer"
		} satisfies ErrorResponse)
		return
	}
}
