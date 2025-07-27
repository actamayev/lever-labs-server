import PrismaClientClass from "../../../classes/prisma-client"

export default async function deleteCareerQuestChat(userId: number, challengeId: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_quest_chat.updateMany({
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
