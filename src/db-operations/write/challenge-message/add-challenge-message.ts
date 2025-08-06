import { MessageSender } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function addChallengeMessage(
	challengeChatId: number,
	messageText: string,
	sender: MessageSender,
	modelUsed?: string
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const challengeMessage = await prismaClient.challenge_message.create({
			data: {
				challenge_chat_id: challengeChatId,
				message_text: messageText,
				sender: sender,
				model_used: modelUsed
			}
		})

		return challengeMessage.challenge_message_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
