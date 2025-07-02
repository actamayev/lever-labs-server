import { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts"
import retrieveCqChatMessages from "../../db-operations/read/career-quest-message/retrieve-cq-chat-messages"

export default async function attachCQConversationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { careerQuestChatId } = req.body

		const chatMessages = await retrieveCqChatMessages(careerQuestChatId)

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
