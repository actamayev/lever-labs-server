import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateSandboxChat(projectUUID: SandboxProjectUUID): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// First, try to find an existing active sandbox chat
		const existingChat = await prismaClient.sandbox_chat.findFirst({
			where: {
				project_uuid: projectUUID,
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
				project_uuid: projectUUID
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
