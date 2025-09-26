import { Response, Request } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts/types/api"
import { ScoreboardUUID } from "@bluedotrobots/common-ts/types/utils"
import { Scoreboard } from "@bluedotrobots/common-ts/types/scoreboard"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default function updateTeamScore(req: Request, res: Response): void {
	try {
		const { teamNumber, newScore, scoreboardId } = req.body as { teamNumber: number, newScore: number, scoreboardId: ScoreboardUUID }

		ScoreboardManager.getInstance().setTeamScore(scoreboardId, teamNumber as 1 | 2, newScore)
		const scoreboard = ScoreboardManager.getInstance().getScoreboard(scoreboardId)

		if (!scoreboard) {
			res.status(404).json({ error: "Scoreboard not found" } satisfies ErrorResponse)
			return
		}

		res.status(200).json(scoreboard satisfies Scoreboard)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update team score" } satisfies ErrorResponse)
		return
	}
}
