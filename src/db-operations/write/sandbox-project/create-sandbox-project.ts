import { BlocklyJson, SandboxProject } from "@actamayev/lever-labs-common-ts/types/sandbox"
import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

// eslint-disable-next-line max-lines-per-function
export default async function createSandboxProjectDB(userId: number): Promise<SandboxProject> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const uuid = crypto.randomUUID() as SandboxProjectUUID
		const defaultSandboxJson: BlocklyJson = {}
		const sandboxProjectWithUser = await prismaClient.sandbox_project.create({
			data: {
				sandbox_json: defaultSandboxJson,
				project_owner_id: userId,
				project_uuid: uuid
			},
			select: {
				sandbox_json: true,
				project_uuid: true,
				is_starred: true,
				project_name: true,
				created_at: true,
				updated_at: true,
				project_notes: true,
				project_owner_id: true,
				user: {
					select: {
						username: true,
						name: true,
						profile_picture: {
							select: {
								image_url: true
							},
							where: {
								is_active: true
							}
						}
					}
				}
			}
		})

		const sandboxProject: RetrievedSandboxData = {
			...sandboxProjectWithUser,
			project_uuid: uuid,
			sandbox_chat: null,
			sandbox_json: defaultSandboxJson,
			sandbox_project_shares: []
		}
		return camelCaseSandboxProject(sandboxProject, userId)
	} catch (error) {
		console.error(error)
		throw error
	}
}
