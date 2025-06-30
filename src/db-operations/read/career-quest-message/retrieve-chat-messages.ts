import { ChatMessage } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveChatMessages(careerQuestChatId: number): Promise<ChatMessage[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Fetch all messages for this chat, ordered by creation time
		const messages = await prismaClient.career_quest_message.findMany({
			where: {
				career_quest_chat_id: careerQuestChatId
			},
			orderBy: {
				created_at: "asc"
			},
			select: {
				message_text: true,
				sender: true,
				created_at: true
			}
		})

		// Transform to conversation history format
		const conversationHistory = messages.map(msg => ({
			role: msg.sender === "USER" ? "user" as const : "assistant" as const,
			content: msg.message_text,
			timestamp: msg.created_at
		}))

		return conversationHistory
	} catch (error) {
		console.error(error)
		throw error
	}
}
