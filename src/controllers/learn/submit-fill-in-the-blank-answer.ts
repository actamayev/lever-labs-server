import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import addFillInTheBlankUserAnswer from "../../db-operations/write/user-answer/add-fill-in-the-blank-user-answer"

export default async function submitFillInTheBlankAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { fillInTheBlankId, userCppAnswer, isCorrect } = req.body as {
			fillInTheBlankId: string; userCppAnswer: string; isCorrect: boolean
		}

		await addFillInTheBlankUserAnswer(userId, fillInTheBlankId, userCppAnswer, isCorrect)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit fill in the blank answer" } satisfies ErrorResponse)
		return
	}
}


