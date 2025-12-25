import { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"
import retrieveChallengeChatMessages from "../../db-operations/read/challenge-message/retrieve-challenge-chat-messages"

export default async function attachChallengeConversationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { challengeChatId } = req.body

		// TODO 7/17/25: We need to also get the code submission, and hint history
		const challengeChatMessages = await retrieveChallengeChatMessages(challengeChatId)

		req.body.conversationHistory = challengeChatMessages
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to fetch conversation history"
		} satisfies ErrorResponse)
		return
	}
}
