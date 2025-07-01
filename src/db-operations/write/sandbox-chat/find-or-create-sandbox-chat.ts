import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateSandboxChat(sandboxProjectId: number): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxChatId = await prismaClient.sandbox_chat.upsert({
			select: {
				sandbox_chat_id: true,
			},
			where: {
				sandbox_project_id: sandboxProjectId
			},
			update: {},
			create: {
				sandbox_project_id: sandboxProjectId
			}
		})

		return sandboxChatId.sandbox_chat_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
