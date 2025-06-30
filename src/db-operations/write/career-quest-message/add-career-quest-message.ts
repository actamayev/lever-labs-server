import { MessageSender } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export async function addCareerQuestMessage(
	careerQuestChatId: number,
	messageText: string,
	sender: MessageSender,
	modelUsed?: string
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const message = await prismaClient.career_quest_message.create({
			data: {
				career_quest_chat_id: careerQuestChatId,
				message_text: messageText,
				sender: sender,
				model_used: modelUsed
			}
		})

		return message.message_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
