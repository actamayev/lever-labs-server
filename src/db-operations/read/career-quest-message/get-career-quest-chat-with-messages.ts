import { ChatMessage } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export async function getCareerQuestChatMessages(
	userId: number,
	challengeId: string
): Promise<ChatMessage[] | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const chat = await prismaClient.career_quest_chat.findUnique({
			where: {
				career_quest_id_user_id: {
					career_quest_id: challengeId,
					user_id: userId
				}
			},
			include: {
				messages: {
					orderBy: {
						created_at: "asc"
					},
					select: {
						message_text: true,
						sender: true,
						created_at: true
					}
				}
			}
		})

		if (!chat) return null

		return chat.messages.map(msg => ({
			content: msg.message_text,
			role: msg.sender === "USER" ? "user" as const : "assistant" as const,
			timestamp: msg.created_at
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
