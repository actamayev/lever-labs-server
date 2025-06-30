import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateCareerQuestChat(userId: number, careerQuestId: string): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const careerQuestChatId = await prismaClient.career_quest_chat.upsert({
			select: {
				career_quest_chat_id: true,
			},
			where: {
				career_quest_id_user_id: {
					career_quest_id: careerQuestId,
					user_id: userId
				}
			},
			update: {},
			create: {
				career_quest_id: careerQuestId,
				user_id: userId
			}
		})

		return careerQuestChatId.career_quest_chat_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
