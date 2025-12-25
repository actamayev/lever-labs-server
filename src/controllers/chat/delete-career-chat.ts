import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import deleteCareerChat from "../../db-operations/write/career-chat/delete-career-chat"

export default async function deleteCareerChatController(req: Request, res: Response): Promise<void> {
	try {
		const { userId, careerId } = req

		await deleteCareerChat(userId, careerId)

		res.status(200).json({ success: "Career chat deleted successfully" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete career chat" } satisfies ErrorResponse)
		return
	}
}
