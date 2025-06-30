import { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts"
import retrieveChatMessages from "../../db-operations/read/career-quest-message/retrieve-chat-messages"

export default async function attachConversationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { careerQuestChatId } = req.body

		const chatMessages = await retrieveChatMessages(careerQuestChatId)

		req.body.conversationHistory = chatMessages
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to fetch conversation history"
		} as ErrorResponse)
		return
	}
}
