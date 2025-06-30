import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateCareerQuestChat(userId: number, careerQuestId: string): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const chat = await prismaClient.career_quest_chat.upsert({
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

		return chat.career_quest_chat_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
