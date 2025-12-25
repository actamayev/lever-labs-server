import { ArcadeGameType } from "@actamayev/lever-labs-common-ts/types/arcade"
import PrismaClientClass from "../../../classes/prisma-client"
import { convertArcadeGameTypeToName } from "../../../utils/arcade/convert-arcade-game"

export default async function addArcadeScore(
	userId: number,
	arcadeGameName: ArcadeGameType,
	score: number
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const gameName = convertArcadeGameTypeToName(arcadeGameName)

		await prismaClient.arcade_score.create({
			data: {
				user_id: userId,
				arcade_game_name: gameName,
				score: score
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}

