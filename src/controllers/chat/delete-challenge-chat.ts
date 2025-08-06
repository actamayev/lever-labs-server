import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts"
import deleteChallengeChat from "../../db-operations/write/challenge-chat/delete-challenge-chat"

export default async function deleteChallengeChatController(req: Request, res: Response): Promise<void> {
	try {
		const { userId, challengeId } = req

		await deleteChallengeChat(userId, challengeId)

		res.status(200).json({ success: "Challenge chat deleted successfully" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete challenge chat" } satisfies ErrorResponse)
		return
	}
}
