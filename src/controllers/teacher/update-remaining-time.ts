import { Response, Request } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts/types/api"
import { ScoreboardUUID } from "@bluedotrobots/common-ts/types/utils"
import { Scoreboard } from "@bluedotrobots/common-ts/types/scoreboard"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default function updateRemainingTime(req: Request, res: Response): void {
	try {
		const { scoreboardId, timeRemainingInSeconds } = req.body as { scoreboardId: ScoreboardUUID, timeRemainingInSeconds: number }

		ScoreboardManager.getInstance().setRemainingTime(scoreboardId, timeRemainingInSeconds)
		const scoreboard = ScoreboardManager.getInstance().getScoreboard(scoreboardId)

		if (!scoreboard) {
			res.status(404).json({ error: "Scoreboard not found" } satisfies ErrorResponse)
			return
		}

		res.status(200).json(scoreboard satisfies Scoreboard)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update remaining time" } satisfies ErrorResponse)
		return
	}
}
