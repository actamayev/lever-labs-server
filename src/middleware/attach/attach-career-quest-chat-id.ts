import { Request, Response, NextFunction } from "express"
import { ErrorResponse} from "@bluedotrobots/common-ts"
import findOrCreateCareerQuestChat from "../../db-operations/write/career-quest-chat/find-or-create-career-quest-chat"

export default async function attachCareerQuestChatId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId, challengeId } = req
		const careerQuestChatId = await findOrCreateCareerQuestChat(userId, challengeId)

		req.body.careerQuestChatId = careerQuestChatId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to attach career quest chat id" } satisfies ErrorResponse
		)
		return
	}
}
