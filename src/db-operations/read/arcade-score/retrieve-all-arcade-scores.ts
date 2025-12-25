import PrismaClientClass from "../../../classes/prisma-client"
import { ArcadeScore } from "@actamayev/lever-labs-common-ts/types/arcade"
import { convertArcadeGameNameToType } from "../../../utils/arcade/convert-arcade-game"

export default async function retrieveAllArcadeScores(userId: number): Promise<ArcadeScore[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Fetch all scores ordered by score descending to get highest scores first
		const arcadeScores = await prismaClient.arcade_score.findMany({
			select: {
				arcade_score_id: true,
				arcade_game_name: true,
				score: true,
				user_id: true,
				created_at: true,
				user: { select: { username: true } }
			},
			orderBy: [{ score: "desc" }, { created_at: "desc" }]
		})

		// Group by user_id and arcade_game_name, keeping only the highest score for each combination
		const highestScoresMap = new Map<string, typeof arcadeScores[0]>()
		for (const score of arcadeScores) {
			const key = `${score.user_id}-${score.arcade_game_name}`
			if (!highestScoresMap.has(key)) highestScoresMap.set(key, score)
		}

		// Convert to array and map to ArcadeScore format
		return Array.from(highestScoresMap.values()).map(score => ({
			arcadeScoreId: score.arcade_score_id,
			arcadeGameName: convertArcadeGameNameToType(score.arcade_game_name),
			score: score.score,
			username: score.user.username || "",
			createdAt: score.created_at,
			isMyScore: score.user_id === userId
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}

