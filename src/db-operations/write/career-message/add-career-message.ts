import { MessageSender } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function addCareerMessage(
	careerChatId: number,
	messageText: string,
	sender: MessageSender,
	modelUsed?: string
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const careerMessage = await prismaClient.career_message.create({
			data: {
				career_chat_id: careerChatId,
				message_text: messageText,
				sender: sender,
				model_used: modelUsed
			}
		})

		return careerMessage.career_message_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
