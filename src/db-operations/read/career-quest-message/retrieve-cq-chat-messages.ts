import { CareerQuestChatMessage } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveCqChatMessages(careerQuestChatId: number): Promise<CareerQuestChatMessage[]> {
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
		return messages.map(msg => ({
			role: msg.sender === "USER" ? "user" as const : "assistant" as const,
			content: msg.message_text,
			timestamp: new Date(msg.created_at),
		} satisfies CareerQuestChatMessage))
	} catch (error) {
		console.error(error)
		throw error
	}
}
