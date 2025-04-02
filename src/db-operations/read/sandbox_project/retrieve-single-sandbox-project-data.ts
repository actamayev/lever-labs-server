import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveSingleSandboxProjectData(projectUUID: ProjectUUID): Promise<SandboxProject | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProject = await prismaClient.sandbox_project.findFirst({
			where: {
				project_uuid: projectUUID
			}
		})

		if (isNull(sandboxProject)) return null

		return {
			sandboxXml: sandboxProject.sandbox_xml,
			projectUUID: sandboxProject.project_uuid as ProjectUUID,
			isStarred: sandboxProject.is_starred,
			projectName: sandboxProject.project_name,
			createdAt: sandboxProject.created_at,
			updatedAt: sandboxProject.updated_at
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
