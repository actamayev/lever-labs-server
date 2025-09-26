import { randomUUID } from "crypto"
import { Response, Request } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts/types/api"
import { ClassCode, ScoreboardUUID } from "@bluedotrobots/common-ts/types/utils"
import { Scoreboard } from "@bluedotrobots/common-ts/types/scoreboard"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default function createScoreboard(req: Request, res: Response): void {
	try {
		const { classCode } = req.params as { classCode: ClassCode }
		const { scoreboardName } = req.body as { scoreboardName: string }

		const scoreboardId = randomUUID() as ScoreboardUUID
		const scoreboard = ScoreboardManager.getInstance().createScoreboard(scoreboardId, scoreboardName, classCode)

		res.status(200).json(scoreboard satisfies Scoreboard)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create scoreboard" } satisfies ErrorResponse)
		return
	}
}
