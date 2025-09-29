import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import { ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default async function updateTeamScore(req: Request, res: Response): Promise<void> {
	try {
		const { teamNumber, newScore, scoreboardId } = req.body as { teamNumber: number, newScore: number, scoreboardId: ScoreboardUUID }

		await ScoreboardManager.getInstance().setTeamScore(scoreboardId, teamNumber as 1 | 2, newScore)
		const scoreboard = await ScoreboardManager.getInstance().getScoreboard(scoreboardId)

		if (!scoreboard) {
			res.status(500).json({ error: "Scoreboard not found" } satisfies ErrorResponse)
			return
		}

		res.status(200).json({success: "Team score updated successfully" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update team score" } satisfies ErrorResponse)
		return
	}
}
