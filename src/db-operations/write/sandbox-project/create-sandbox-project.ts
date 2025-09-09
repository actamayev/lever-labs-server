import { BlocklyJson, SandboxProject } from "@bluedotrobots/common-ts/types/sandbox"
import { SandboxProjectUUID } from "@bluedotrobots/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

export default async function createSandboxProjectDB(userId: number): Promise<SandboxProject> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const uuid = crypto.randomUUID() as SandboxProjectUUID
		const defaultSandboxJson: BlocklyJson = {}
		const sandboxProjectWithoutChat = await prismaClient.sandbox_project.create({
			data: {
				sandbox_json: defaultSandboxJson,
				project_owner_id: userId,
				project_uuid: uuid
			}
		})

		const sandboxProject: RetrievedSandboxData = {
			...sandboxProjectWithoutChat,
			project_uuid: uuid,
			sandbox_chat: null,
			sandbox_json: defaultSandboxJson
		}
		return camelCaseSandboxProject(sandboxProject)
	} catch (error) {
		console.error(error)
		throw error
	}
}
