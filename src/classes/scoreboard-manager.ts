import { isNull } from "lodash"
import SingletonWithRedis from "./singletons/singleton-with-redis"
import { ClassCode, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import { Scoreboard, TeamStats, StudentJoinedScoreboardData } from "@lever-labs/common-ts/types/scoreboard"

export default class ScoreboardManager extends SingletonWithRedis {
	private constructor() {
		super()
	}

	public static override getInstance(): ScoreboardManager {
		if (!ScoreboardManager.instance) {
			ScoreboardManager.instance = new ScoreboardManager()
		}
		return ScoreboardManager.instance
	}

	public async createScoreboard(
		scoreboardId: ScoreboardUUID,
		scoreboardName: string,
		classCode: ClassCode
	): Promise<Scoreboard> {
		const scoreboard: Scoreboard = {
			scoreboardId,
			classCode,
			scoreboardName,
			team1Stats: this.createBlankTeamStats("Team 1"),
			team2Stats: this.createBlankTeamStats("Team 2"),
			timeRemaining: 0
		}

		const redis = await this.getRedis()
		await redis.set(`scoreboard:${scoreboardId}`, JSON.stringify(scoreboard))

		return scoreboard
	}

	public async getScoreboard(scoreboardId: ScoreboardUUID): Promise<Scoreboard | undefined> {
		const redis = await this.getRedis()
		const data = await redis.get(`scoreboard:${scoreboardId}`)

		if (!data) return undefined

		return JSON.parse(data) as Scoreboard
	}

	public async cleanupScoreboard(scoreboardId: ScoreboardUUID): Promise<void> {
		const redis = await this.getRedis()
		await redis.del(`scoreboard:${scoreboardId}`)
	}

	private createBlankTeamStats(teamName: string): TeamStats {
		return { teamName, score: 0, students: [] }
	}

	public async getScoreboards(classCode: ClassCode): Promise<Scoreboard[]> {
		const redis = await this.getRedis()
		const keys = await redis.keys("scoreboard:*")

		const scoreboards: Scoreboard[] = []

		for (const key of keys) {
			const data = await redis.get(key)
			if (isNull(data)) continue
			const scoreboard = JSON.parse(data) as Scoreboard
			if (scoreboard.classCode === classCode) {
				scoreboards.push(scoreboard)
			}
		}

		return scoreboards
	}

	public async setTeamScore(scoreboardId: ScoreboardUUID, team: 1 | 2, newScore: number): Promise<void> {
		const scoreboard = await this.getScoreboard(scoreboardId)
		if (!scoreboard) return

		if (team === 1) scoreboard.team1Stats.score = newScore
		else scoreboard.team2Stats.score = newScore

		const redis = await this.getRedis()
		await redis.set(`scoreboard:${scoreboardId}`, JSON.stringify(scoreboard))
	}

	public async setRemainingTime(scoreboardId: ScoreboardUUID, timeRemaining: number): Promise<void> {
		const scoreboard = await this.getScoreboard(scoreboardId)
		if (!scoreboard) return

		scoreboard.timeRemaining = timeRemaining

		const redis = await this.getRedis()
		await redis.set(`scoreboard:${scoreboardId}`, JSON.stringify(scoreboard))
	}

	public async addStudent(scoreboardId: ScoreboardUUID, team: 1 | 2, studentId: number, username: string): Promise<void> {
		const scoreboard = await this.getScoreboard(scoreboardId)
		if (!scoreboard) return

		const studentData: StudentJoinedScoreboardData = { studentId, username }

		if (team === 1) {
			// Check if student is already in team 1
			if (!scoreboard.team1Stats.students.some(s => s.studentId === studentId)) {
				scoreboard.team1Stats.students.push(studentData)
			}
		} else {
			// Check if student is already in team 2
			if (!scoreboard.team2Stats.students.some(s => s.studentId === studentId)) {
				scoreboard.team2Stats.students.push(studentData)
			}
		}

		const redis = await this.getRedis()
		await redis.set(`scoreboard:${scoreboardId}`, JSON.stringify(scoreboard))
	}

	public async removeStudent(scoreboardId: ScoreboardUUID, team: 1 | 2, studentId: number): Promise<void> {
		const scoreboard = await this.getScoreboard(scoreboardId)
		if (!scoreboard) return

		if (team === 1) {
			// Remove from team 1
			scoreboard.team1Stats.students = scoreboard.team1Stats.students.filter(s => s.studentId !== studentId)
		} else {
			// Remove from team 2
			scoreboard.team2Stats.students = scoreboard.team2Stats.students.filter(s => s.studentId !== studentId)
		}

		const redis = await this.getRedis()
		await redis.set(`scoreboard:${scoreboardId}`, JSON.stringify(scoreboard))
	}
}
