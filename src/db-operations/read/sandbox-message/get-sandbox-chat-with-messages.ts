import { isNull } from "lodash"
import { ChatMessage } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export async function getSandboxChatMessages(sandboxProjectId: number): Promise<ChatMessage[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const chat = await prismaClient.sandbox_chat.findUnique({
			where: {
				sandbox_project_id: sandboxProjectId
			},
			select: {
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

		if (isNull(chat)) return []

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
