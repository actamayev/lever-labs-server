import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserIdFromSandboxProjectUUID(projectUUID: SandboxProjectUUID): Promise<number | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProject = await prismaClient.sandbox_project.findFirst({
			select: {
				project_owner_id: true
			},
			where: {
				project_uuid: projectUUID
			}
		})

		return sandboxProject?.project_owner_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
