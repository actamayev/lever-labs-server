import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

export default async function retrieveSingleSandboxProjectData(projectUUID: ProjectUUID): Promise<SandboxProject | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProject = await prismaClient.sandbox_project.findFirst({
			where: {
				project_uuid: projectUUID
			}
		})

		if (isNull(sandboxProject)) return null

		return camelCaseSandboxProject(sandboxProject)
	} catch (error) {
		console.error(error)
		throw error
	}
}
