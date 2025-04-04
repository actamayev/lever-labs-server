import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserIdFromSandboxProjectUUID(sandboxProjectId: number): Promise<number | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProject = await prismaClient.sandbox_project.findFirst({
			select: {
				project_owner_id: true
			},
			where: {
				sandbox_project_id: sandboxProjectId
			}
		})

		return sandboxProject?.project_owner_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
