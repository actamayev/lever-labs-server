import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateSandboxProjectName(projectUUID: SandboxProjectUUID, newProjectName: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				project_uuid: projectUUID
			},
			data: {
				project_name: newProjectName
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
