import { Request, Response } from "express"
import { CareerQuestChatDataResponse, ErrorResponse } from "@bluedotrobots/common-ts"
import { getCareerQuestChatMessages } from "../../db-operations/read/career-quest-message/get-career-quest-chat-with-messages"

export default async function getCareerQuestChat(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { challengeId } = req.params

		const chatData = await getCareerQuestChatMessages(userId, challengeId)

		res.status(200).json({ chatData } as CareerQuestChatDataResponse)
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to retrieve chat"
		} as ErrorResponse)
	}
}
