import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import addArcadeScore from "../../db-operations/write/arcade-score/add-arcade-score"
import { ArcadeGameType } from "@actamayev/lever-labs-common-ts/types/arcade"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import retrieveUsername from "../../db-operations/read/credentials/retrieve-username"
import retrieveUserHighestScore from "../../db-operations/read/arcade-score/retrieve-user-highest-score"

export default async function addArcadeScoreController(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { arcadeGameName, score } = req.body as { arcadeGameName: ArcadeGameType, score: number }

		// Check if this is a new high score before adding
		const currentHighestScore = await retrieveUserHighestScore(userId, arcadeGameName)
		const isNewHighScore = currentHighestScore === null || score > currentHighestScore

		await addArcadeScore(userId, arcadeGameName, score)

		// Only emit if this is a new high score
		if (isNewHighScore) {
			const username = await retrieveUsername(userId)
			if (username) {
				BrowserSocketManager.getInstance().emitArcadeScoreUpdate(score, username, userId, arcadeGameName)
			}
		}

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add arcade score" } satisfies ErrorResponse)
		return
	}
}
