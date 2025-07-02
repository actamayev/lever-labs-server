import { MessageSender } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function addSandboxMessage(
	sandboxChatId: number,
	messageText: string,
	sender: MessageSender,
	modelUsed?: string
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxMessage = await prismaClient.sandbox_message.create({
			data: {
				sandbox_chat_id: sandboxChatId,
				message_text: messageText,
				sender: sender,
				model_used: modelUsed
			}
		})

		return sandboxMessage.sandbox_message_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
