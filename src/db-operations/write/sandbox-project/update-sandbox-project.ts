import { BlocklyJson } from "@lever-labs/common-ts/types/sandbox"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateSandboxProject(sandboxProjectId: number, newBlocklyJson: BlocklyJson): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		console.log(JSON.stringify(newBlocklyJson, null, 2))

		await prismaClient.sandbox_project.update({
			where: {
				sandbox_project_id: sandboxProjectId
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
