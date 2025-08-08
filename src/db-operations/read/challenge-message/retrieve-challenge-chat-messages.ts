import { ChallengeChatMessage } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveChallengeChatMessages(challengeChatId: number): Promise<ChallengeChatMessage[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Fetch all messages for this chat, ordered by creation time
		const messages = await prismaClient.challenge_message.findMany({
			where: {
				challenge_chat_id: challengeChatId
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
		} satisfies ChallengeChatMessage))
	} catch (error) {
		console.error(error)
		throw error
	}
}
