import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function getNextHintNumber(careerQuestChatId: number): Promise<number> {
	const hintCount = await prisma.career_quest_hint.count({
		where: {
			career_quest_chat_id: careerQuestChatId
		}
	})

	return hintCount + 1
}
