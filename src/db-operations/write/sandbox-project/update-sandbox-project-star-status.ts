import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateSandboxStarStatus(sandboxProjectId: number, newStarStatus: boolean): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				sandbox_project_id: sandboxProjectId
			},
			data: {
				is_starred: newStarStatus
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
