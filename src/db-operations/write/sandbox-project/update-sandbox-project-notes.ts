import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateSandboxProjectNotes(sandboxProjectId: number, newProjectNotes: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				sandbox_project_id: sandboxProjectId
			},
			data: {
				project_notes: newProjectNotes
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
