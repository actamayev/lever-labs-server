import PrismaClientClass from "../../../classes/prisma-client"
import { ArcadeScore } from "@lever-labs/common-ts/types/arcade"
import { convertArcadeGameNameToType } from "../../../utils/arcade/convert-arcade-game"

export default async function retrieveAllArcadeScores(userId: number): Promise<ArcadeScore[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const arcadeScores = await prismaClient.arcade_score.findMany({
			select: {
				arcade_score_id: true,
				arcade_game_name: true,
				score: true,
				user_id: true,
				created_at: true,
				user: {
					select: {
						username: true
					}
				}
			},
			orderBy: {
				created_at: "desc"
			}
		})

		return arcadeScores.map(score => ({
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

