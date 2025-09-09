import { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts/types/api"
import retrieveCareerChatMessages from "../../db-operations/read/career-message/retrieve-career-chat-messages"

export default async function attachCareerConversationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { careerChatId } = req.body

		const careerChatMessages = await retrieveCareerChatMessages(careerChatId)

		req.body.conversationHistory = careerChatMessages
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to fetch conversation history"
		} satisfies ErrorResponse)
		return
	}
}
