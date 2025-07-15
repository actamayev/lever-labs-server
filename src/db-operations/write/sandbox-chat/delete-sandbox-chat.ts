import PrismaClientClass from "../../../classes/prisma-client"

export default async function deleteSandboxChat(sandboxProjectId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_chat.updateMany({
			where: {
				sandbox_project_id: sandboxProjectId,
				is_active: true
			},
			data: {
				is_active: false
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
