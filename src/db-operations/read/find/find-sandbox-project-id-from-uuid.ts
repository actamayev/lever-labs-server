import { SandboxProjectUUID } from "@bluedotrobots/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function findSandboxProjectIdFromUUID(projectUUID: SandboxProjectUUID): Promise<number | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const projectId = await prismaClient.sandbox_project.findFirst({
			select: {
				sandbox_project_id: true
			},
			where: {
				project_uuid: projectUUID
			}
		})

		return projectId?.sandbox_project_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
