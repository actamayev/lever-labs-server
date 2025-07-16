import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface AddCareerQuestHintData {
	careerQuestChatId: number
	hintText: string
	modelUsed: string
}

export default async function addCareerQuestHint(data: AddCareerQuestHintData): Promise<void> {
	await prisma.career_quest_hint.create({
		data: {
			career_quest_chat_id: data.careerQuestChatId,
			hint_text: data.hintText,
			model_used: data.modelUsed
		}
	})
}
