import { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"
import retrieveSandboxChatMessages from "../../db-operations/read/sandbox-message/retrieve-sandbox-chat-messages"

export default async function attachSandboxConversationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { sandboxChatId } = req.body

		const chatMessages = await retrieveSandboxChatMessages(sandboxChatId)

		req.body.conversationHistory = chatMessages
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to fetch conversation history"
		} satisfies ErrorResponse)
		return
	}
}
