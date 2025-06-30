import { Request, Response, NextFunction } from "express"
import { ErrorResponse, OutgoingCareerQuestChatData} from "@bluedotrobots/common-ts"
import findOrCreateCareerQuestChat from "../../db-operations/write/career-quest-chat/find-or-create-career-quest-chat"

export default async function attachCareerQuestChatId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req
		const chatData = req.body as OutgoingCareerQuestChatData

		const careerQuestChatId = await findOrCreateCareerQuestChat(userId, chatData.careerQuestChallengeId)

		req.body.careerQuestChatId = careerQuestChatId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to confirm another user isn't connected to this Pip" } as ErrorResponse
		)
		return
	}
}
