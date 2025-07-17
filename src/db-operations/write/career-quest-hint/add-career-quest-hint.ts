
import PrismaClientClass from "../../../classes/prisma-client"

interface AddCareerQuestHintData {
	careerQuestChatId: number
	hintText: string
	modelUsed: string
}

export default async function addCareerQuestHint(data: AddCareerQuestHintData): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_quest_hint.create({
			data: {
				career_quest_chat_id: data.careerQuestChatId,
				hint_text: data.hintText,
				model_used: data.modelUsed
			}
		})
	} catch (error) {
		console.error("Error adding career quest hint:", error)
		throw error
	}
}
