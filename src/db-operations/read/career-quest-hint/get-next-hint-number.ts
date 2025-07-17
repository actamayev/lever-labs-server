import PrismaClientClass from "../../../classes/prisma-client"

export default async function getNextHintNumber(careerQuestChatId: number): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const hintCount = await prismaClient.career_quest_hint.count({
			where: {
				career_quest_chat_id: careerQuestChatId
			}
		})

		return hintCount + 1
	} catch (error) {
		console.error("Error getting next hint number:", error)
		throw error
	}
}
