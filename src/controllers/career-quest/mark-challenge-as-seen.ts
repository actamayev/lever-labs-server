import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import markChallengeAsSeenDB from "../../db-operations/write/user-seen-challenges/mark-challenge-as-seen"

export default async function markChallengeAsSeen(req: Request, res: Response): Promise<void> {
	try {
		const { userId, challengeId } = req

		await markChallengeAsSeenDB(userId, challengeId)
		res.status(200).json({ success: "Challenge marked as seen" } satisfies SuccessResponse)
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to mark challenge as seen" } satisfies ErrorResponse)
		return
	}
}
