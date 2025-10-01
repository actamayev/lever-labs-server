import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import addBlockToFunctionUserAnswer from "../../db-operations/write/user-answer/add-block-to-function-user-answer"

export default async function submitBlockToFunctionAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { answerChoiceId } = req.body as { answerChoiceId: number }

		await addBlockToFunctionUserAnswer(userId, answerChoiceId)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit block to function answer" } satisfies ErrorResponse)
		return
	}
}


