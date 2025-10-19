import Singleton from "./singletons/singleton"
import MongoClientClass from "./mongo-client-class"
import { ClassCode, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import { Scoreboard as ScoreboardType, StudentJoinedScoreboardData } from "@lever-labs/common-ts/types/scoreboard"
import { ScoreboardModel, TeamStats as TeamStatsClass } from "../models/Scoreboard.model"

export default class ScoreboardManager extends Singleton {
	private constructor() {
		super()
	}

	public static override async getInstance(): Promise<ScoreboardManager> {
		if (!ScoreboardManager.instance) {
			// Ensure MongoDB is connected
			await MongoClientClass.connect()
			ScoreboardManager.instance = new ScoreboardManager()
		}
		return ScoreboardManager.instance as ScoreboardManager
	}

	public async createScoreboard(
		scoreboardId: ScoreboardUUID,
		scoreboardName: string,
		classCode: ClassCode
	): Promise<ScoreboardType> {
		const scoreboard = await ScoreboardModel.create({
			scoreboardId,
			classCode,
			scoreboardName,
			team1Stats: this.createBlankTeamStats("Team 1"),
			team2Stats: this.createBlankTeamStats("Team 2"),
			timeRemaining: 0
		})

		// Convert to plain object and cast to return type
		return scoreboard.toObject() as unknown as ScoreboardType
	}

	public async getScoreboard(scoreboardId: ScoreboardUUID): Promise<ScoreboardType | undefined> {
		const scoreboard = await ScoreboardModel.findOne({ scoreboardId }).lean()

		if (!scoreboard) return undefined

		return scoreboard as unknown as ScoreboardType
	}

	public async cleanupScoreboard(scoreboardId: ScoreboardUUID): Promise<void> {
		await ScoreboardModel.deleteOne({ scoreboardId })
	}

	private createBlankTeamStats(teamName: string): TeamStatsClass {
		return {
			teamName,
			score: 0,
			students: []
		}
	}

	public async getScoreboards(classCode: ClassCode): Promise<ScoreboardType[]> {
		const scoreboards = await ScoreboardModel.find({ classCode }).lean()

		return scoreboards as unknown as ScoreboardType[]
	}

	public async setTeamScore(scoreboardId: ScoreboardUUID, team: 1 | 2, newScore: number): Promise<void> {
		const field = team === 1 ? "team1Stats.score" : "team2Stats.score"

		await ScoreboardModel.updateOne(
			{ scoreboardId },
			{ $set: { [field]: newScore } }
		)
	}

	public async setRemainingTime(scoreboardId: ScoreboardUUID, timeRemaining: number): Promise<void> {
		await ScoreboardModel.updateOne(
			{ scoreboardId },
			{ $set: { timeRemaining } }
		)
	}

	public async addStudent(
		scoreboardId: ScoreboardUUID,
		team: 1 | 2,
		studentId: number,
		username: string
	): Promise<void> {
		const field = team === 1 ? "team1Stats.students" : "team2Stats.students"
		const studentData: StudentJoinedScoreboardData = { studentId, username }

		// Use $addToSet to prevent duplicates automatically
		await ScoreboardModel.updateOne(
			{ scoreboardId },
			{ $addToSet: { [field]: studentData } }
		)
	}

	public async removeStudent(scoreboardId: ScoreboardUUID, team: 1 | 2, studentId: number): Promise<void> {
		const field = team === 1 ? "team1Stats.students" : "team2Stats.students"

		await ScoreboardModel.updateOne(
			{ scoreboardId },
			{ $pull: { [field]: { studentId } } }
		)
	}
}
