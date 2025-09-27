import { ChallengeUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function findChallengeIdFromUUID(challengeUUID: ChallengeUUID): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedChallenge = await prismaClient.challenge.findFirst({
			where: {
				challenge_uuid: challengeUUID
			}
		})

		return retrievedChallenge?.challenge_id || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
