import { randomUUID } from "crypto"
import { Response, Request } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"
import { ClassCode, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import { Scoreboard } from "@lever-labs/common-ts/types/scoreboard"
import ScoreboardManager from "../../classes/scoreboard-manager"

export default async function createScoreboard(req: Request, res: Response): Promise<void> {
	try {
		const { classCode } = req.params as { classCode: ClassCode }
		const { scoreboardName } = req.body as { scoreboardName: string }

		const scoreboardId = randomUUID() as ScoreboardUUID
		const scoreboard = await ScoreboardManager.getInstance().createScoreboard(scoreboardId, scoreboardName, classCode)

		res.status(200).json(scoreboard satisfies Scoreboard)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create scoreboard" } satisfies ErrorResponse)
		return
	}
}
