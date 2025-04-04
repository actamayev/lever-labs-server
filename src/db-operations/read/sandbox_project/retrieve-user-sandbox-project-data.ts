import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

export default async function retrieveUserSandboxProjectData(userId: number): Promise<SandboxProject[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProjects = await prismaClient.sandbox_project.findMany({
			where: {
				project_owner_id: userId,
				is_active: true
			}
		})

		return sandboxProjects.map(sandboxProject => camelCaseSandboxProject(sandboxProject))
	} catch (error) {
		console.error(error)
		throw error
	}
}
