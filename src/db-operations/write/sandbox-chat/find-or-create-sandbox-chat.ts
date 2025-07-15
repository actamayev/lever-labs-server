import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateSandboxChat(sandboxProjectId: number): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// First, try to find an existing active sandbox chat
		const existingChat = await prismaClient.sandbox_chat.findFirst({
			where: {
				sandbox_project_id: sandboxProjectId,
				is_active: true
			},
			select: {
				sandbox_chat_id: true,
			}
		})

		if (existingChat) {
			return existingChat.sandbox_chat_id
		}

		// If no active chat exists, create a new one
		const newChat = await prismaClient.sandbox_chat.create({
			data: {
				sandbox_project_id: sandboxProjectId
			},
			select: {
				sandbox_chat_id: true,
			}
		})

		return newChat.sandbox_chat_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
