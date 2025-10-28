import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import addActionToCodeMultipleChoiceUserAnswer from "../../db-operations/write/user-answer/add-action-to-code-multiple-choice-user-answer"

export default async function submitActionToCodeMultipleChoiceAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { answerChoiceId } = req.body as { answerChoiceId: number }

		await addActionToCodeMultipleChoiceUserAnswer(userId, answerChoiceId)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to submit action to code multiple choice answer"
		} satisfies ErrorResponse)
		return
	}
}
