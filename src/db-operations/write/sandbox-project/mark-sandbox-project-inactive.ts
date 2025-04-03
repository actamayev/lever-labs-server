import PrismaClientClass from "../../../classes/prisma-client"

export default async function markSandboxProjectInactive(sandboxProjectId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				sandbox_project_id: sandboxProjectId
			},
			data: {
				is_active: false
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
