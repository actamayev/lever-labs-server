import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts"
import deleteCareerQuestChat from "../../db-operations/write/career-quest-chat/delete-career-quest-chat"

export default async function deleteCareerQuestChatController(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { challengeId } = req.params

		await deleteCareerQuestChat(userId, challengeId)

		res.status(200).json({ success: "Career quest chat deleted successfully" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete career quest chat" } satisfies ErrorResponse)
		return
	}
}
