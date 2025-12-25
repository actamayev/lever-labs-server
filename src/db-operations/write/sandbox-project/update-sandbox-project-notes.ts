import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateSandboxProjectNotes(projectUUID: SandboxProjectUUID, newProjectNotes: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				project_uuid: projectUUID
			},
			data: {
				project_notes: newProjectNotes
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
