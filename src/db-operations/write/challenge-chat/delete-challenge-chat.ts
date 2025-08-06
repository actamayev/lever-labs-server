import PrismaClientClass from "../../../classes/prisma-client"

export default async function deleteChallengeChat(userId: number, challengeId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.challenge_chat.updateMany({
			where: {
				challenge_id: challengeId,
				user_id: userId,
				is_active: true
			},
			data: {
				is_active: false
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
