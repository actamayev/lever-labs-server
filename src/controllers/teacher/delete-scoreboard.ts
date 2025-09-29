import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import { ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default async function deleteScoreboard(req: Request, res: Response): Promise<void> {
	try {
		const { scoreboardId } = req.body as { scoreboardId: ScoreboardUUID }

		// Check if scoreboard exists
		const scoreboard = await ScoreboardManager.getInstance().getScoreboard(scoreboardId)
		if (!scoreboard) {
			res.status(500).json({ error: "Scoreboard not found" } satisfies ErrorResponse)
			return
		}

		// Delete the scoreboard
		await ScoreboardManager.getInstance().cleanupScoreboard(scoreboardId)

		res.status(200).json({ success: "Scoreboard deleted successfully" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete scoreboard" } satisfies ErrorResponse)
		return
	}
}
