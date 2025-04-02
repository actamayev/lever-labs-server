import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserSandboxProjectData(userId: number): Promise<SandboxProject[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProjects = await prismaClient.sandbox_project.findMany({
			where: {
				project_owner_id: userId
			}
		})

		return sandboxProjects.map(sandboxProject => ({
			sandboxXml: sandboxProject.sandbox_xml,
			projectUUID: sandboxProject.project_uuid as ProjectUUID,
			isStarred: sandboxProject.is_starred,
			projectName: sandboxProject.project_name,
			createdAt: sandboxProject.created_at,
			updatedAt: sandboxProject.updated_at
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
