import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function markSandboxProjectInactive(projectUUID: SandboxProjectUUID): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				project_uuid: projectUUID
			},
			data: {
				is_active: false
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
