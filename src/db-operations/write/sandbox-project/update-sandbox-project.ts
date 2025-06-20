import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateSandboxProject(sandboxProjectId: number, newJson: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				sandbox_project_id: sandboxProjectId
			},
			data: {
				sandbox_json: newJson
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
