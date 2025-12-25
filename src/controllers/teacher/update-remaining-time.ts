import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { ScoreboardUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default async function updateRemainingTime(req: Request, res: Response): Promise<void> {
	try {
		const { scoreboardId, timeRemainingInSeconds } = req.body as { scoreboardId: ScoreboardUUID, timeRemainingInSeconds: number }

		const scoreboardManager = await ScoreboardManager.getInstance()
		await scoreboardManager.setRemainingTime(scoreboardId, timeRemainingInSeconds)
		const scoreboard = await scoreboardManager.getScoreboard(scoreboardId)

		if (!scoreboard) {
			res.status(500).json({ error: "Scoreboard not found" } satisfies ErrorResponse)
			return
		}

		res.status(200).json({success: "Remaining time updated successfully" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update remaining time" } satisfies ErrorResponse)
		return
	}
}
