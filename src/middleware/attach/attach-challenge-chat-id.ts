import { Request, Response, NextFunction } from "express"
import { ErrorResponse} from "@bluedotrobots/common-ts"
import findOrCreateChallengeChat from "../../db-operations/write/challenge-chat/find-or-create-challenge-chat"

export default async function attachChallengeChatId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId, challengeId } = req
		const challengeChatId = await findOrCreateChallengeChat(userId, challengeId)

		req.body.challengeChatId = challengeChatId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to attach challenge chat id" } satisfies ErrorResponse
		)
		return
	}
}
