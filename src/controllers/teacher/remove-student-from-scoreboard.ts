import { Response, Request } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"
import { ClassCode, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import { Scoreboard } from "@lever-labs/common-ts/types/scoreboard"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default function removeStudentFromScoreboard(req: Request, res: Response): void {
	try {
		const { classCode } = req.params as { classCode: ClassCode }
		const { studentId, scoreboardId, teamNumber } = req.body as {
			studentId: number,
			teamNumber: number,
			scoreboardId: ScoreboardUUID
		}

		// Check if scoreboard exists
		const scoreboard = ScoreboardManager.getInstance().getScoreboard(scoreboardId)
		if (!scoreboard) {
			res.status(500).json({ error: "Scoreboard not found" } satisfies ErrorResponse)
			return
		}

		// Verify the scoreboard belongs to the specified class
		if (scoreboard.classCode !== classCode) {
			res.status(500).json({ error: "Scoreboard does not belong to this class" } satisfies ErrorResponse)
			return
		}
		// Remove student from scoreboard
		ScoreboardManager.getInstance().removeStudent(scoreboardId, teamNumber as 1 | 2, studentId)

		// Return updated scoreboard
		const updatedScoreboard = ScoreboardManager.getInstance().getScoreboard(scoreboardId)
		if (!updatedScoreboard) {
			res.status(500).json({ error: "Scoreboard not found" } satisfies ErrorResponse)
			return
		}
		res.status(200).json(updatedScoreboard satisfies Scoreboard)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to remove student from scoreboard" } satisfies ErrorResponse)
		return
	}
}
