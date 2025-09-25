import Singleton from "./singleton"
import { ClassCode, ScoreboardUUID } from "@bluedotrobots/common-ts/types/utils"
import { Scoreboard, TeamStats } from "@bluedotrobots/common-ts/types/scoreboard"

export default class ScoreboardManager extends Singleton {
	private scoreboards: Map<ScoreboardUUID, Scoreboard> = new Map()

	private constructor() {
		super()
	}

	public static override getInstance(): ScoreboardManager {
		if (!ScoreboardManager.instance) {
			ScoreboardManager.instance = new ScoreboardManager()
		}
		return ScoreboardManager.instance
	}

	public createScoreboard(
		scoreboardId: ScoreboardUUID,
		scoreboardName: string,
		classCode: ClassCode
	): void {
		this.scoreboards.set(
			scoreboardId,
			{
				scoreboardId,
				classCode,
				scoreboardName,
				team1Stats: this.createBlankTeamStats(),
				team2Stats: this.createBlankTeamStats(),
				timeRemaining: 0
			}
		)
	}

	public getScoreboard(scoreboardId: ScoreboardUUID): Scoreboard | undefined {
		return this.scoreboards.get(scoreboardId)
	}

	public cleanupScoreboard(scoreboardId: ScoreboardUUID): void {
		this.scoreboards.delete(scoreboardId)
	}

	private createBlankTeamStats(): TeamStats {
		return { teamName: "Team 1", score: 0 }
	}
}
