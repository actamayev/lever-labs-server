import PrismaClientClass from "../../../classes/prisma-client"

export default async function markChallengeAsSeenDB(userId: number, challengeId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.user_seen_challenges.create({
			data: {
				user_id: userId,
				challenge_id: challengeId
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
