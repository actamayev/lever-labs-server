import Singleton from "./singleton"
import { ClassCode, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"
import { Scoreboard, TeamStats, StudentJoinedScoreboardData } from "@lever-labs/common-ts/types/scoreboard"

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
	): Scoreboard {
		this.scoreboards.set(
			scoreboardId,
			{
				scoreboardId,
				classCode,
				scoreboardName,
				team1Stats: this.createBlankTeamStats("Team 1"),
				team2Stats: this.createBlankTeamStats("Team 2"),
				timeRemaining: 0
			}
		)
		return this.scoreboards.get(scoreboardId) as Scoreboard
	}

	public getScoreboard(scoreboardId: ScoreboardUUID): Scoreboard | undefined {
		return this.scoreboards.get(scoreboardId)
	}

	public cleanupScoreboard(scoreboardId: ScoreboardUUID): void {
		this.scoreboards.delete(scoreboardId)
	}

	private createBlankTeamStats(teamName: string): TeamStats {
		return { teamName, score: 0, students: [] }
	}

	public getScoreboards(classCode: ClassCode): Scoreboard[] {
		return Array.from(this.scoreboards.values()).filter(scoreboard => scoreboard.classCode === classCode)
	}

	public setTeamScore(scoreboardId: ScoreboardUUID, team: 1 | 2, newScore: number): void {
		const scoreboard = this.getScoreboard(scoreboardId)
		if (!scoreboard) return
		if (team === 1) scoreboard.team1Stats.score = newScore
		else scoreboard.team2Stats.score = newScore
	}

	public setRemainingTime(scoreboardId: ScoreboardUUID, timeRemaining: number): void {
		const scoreboard = this.getScoreboard(scoreboardId)
		if (!scoreboard) return
		scoreboard.timeRemaining = timeRemaining
	}

	public addStudent(scoreboardId: ScoreboardUUID, team: 1 | 2, studentId: number, username: string): void {
		const scoreboard = this.getScoreboard(scoreboardId)
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
	}

	public removeStudent(scoreboardId: ScoreboardUUID, team: 1 | 2, studentId: number): void {
		const scoreboard = this.getScoreboard(scoreboardId)
		if (!scoreboard) return

		if (team === 1) {
			// Remove from team 1
			scoreboard.team1Stats.students = scoreboard.team1Stats.students.filter(s => s.studentId !== studentId)
		} else {
			// Remove from team 2
			scoreboard.team2Stats.students = scoreboard.team2Stats.students.filter(s => s.studentId !== studentId)
		}
	}
}
