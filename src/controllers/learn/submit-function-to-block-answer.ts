import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import addFunctionToBlockUserAnswer from "../../db-operations/write/user-answer/add-function-to-block-user-answer"

export default async function submitFunctionToBlockAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { answerChoiceId } = req.body as { answerChoiceId: number }

		await addFunctionToBlockUserAnswer(userId, answerChoiceId)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit function to block answer" } satisfies ErrorResponse)
		return
	}
}


