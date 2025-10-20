import { BlocklyJson } from "@lever-labs/common-ts/types/sandbox"
import PrismaClientClass from "../../../classes/prisma-client"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"

export default async function updateSandboxProject(projectUUID: SandboxProjectUUID, newBlocklyJson: BlocklyJson): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project.update({
			where: {
				project_uuid: projectUUID
			},
			data: {
				sandbox_json: JSON.stringify(newBlocklyJson)
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
