import { Response, Request } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"
import { ClassCode, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import { Scoreboard } from "@lever-labs/common-ts/types/scoreboard"
import ScoreboardManager from "../../classes/scoreboard-manager"
import getStudentUsername from "../../db-operations/read/student/get-student-username"

export default async function addStudentToScoreboard(req: Request, res: Response): Promise<void> {
	try {
		const { classCode } = req.params as { classCode: ClassCode }
		const { studentId, scoreboardId, teamNumber } = req.body as {
			studentId: number,
			scoreboardId: ScoreboardUUID,
			teamNumber: number
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

		// Get student username
		const username = await getStudentUsername(studentId)
		if (!username) {
			res.status(500).json({ error: "Student not found" } satisfies ErrorResponse)
			return
		}

		// Add student to scoreboard
		ScoreboardManager.getInstance().addStudent(scoreboardId, teamNumber as 1 | 2, studentId, username)

		// Return updated scoreboard
		const updatedScoreboard = ScoreboardManager.getInstance().getScoreboard(scoreboardId)
		if (!updatedScoreboard) {
			res.status(500).json({ error: "Internal Server Error: Unable to retrieve updated scoreboard" } satisfies ErrorResponse)
			return
		}
		res.status(200).json(updatedScoreboard satisfies Scoreboard)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add student to scoreboard" } satisfies ErrorResponse)
		return
	}
}
