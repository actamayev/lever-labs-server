import { ArcadeGameType } from "@actamayev/lever-labs-common-ts/types/arcade"
import PrismaClientClass from "../../../classes/prisma-client"
import { convertArcadeGameTypeToName } from "../../../utils/arcade/convert-arcade-game"

export default async function retrieveUserHighestScore(
	userId: number,
	arcadeGameName: ArcadeGameType
): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const gameName = convertArcadeGameTypeToName(arcadeGameName)

		const highestScore = await prismaClient.arcade_score.findFirst({
			where: {
				user_id: userId,
				arcade_game_name: gameName
			},
			select: {
				score: true
			},
			orderBy: {
				score: "desc"
			}
		})

		return highestScore?.score || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
