import { SandboxChatMessage } from "@lever-labs/common-ts/types/chat"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveCareerChatMessages(careerChatId: number): Promise<SandboxChatMessage[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Fetch all messages for this chat, ordered by creation time
		const messages = await prismaClient.career_message.findMany({
			where: {
				career_chat_id: careerChatId
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
		} satisfies SandboxChatMessage))
	} catch (error) {
		console.error(error)
		throw error
	}
}
