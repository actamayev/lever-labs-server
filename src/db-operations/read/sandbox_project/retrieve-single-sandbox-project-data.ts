import { isNull } from "lodash"
import { BlocklyJson, ProjectUUID, SandboxProject } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

// eslint-disable-next-line max-lines-per-function
export default async function retrieveSingleSandboxProjectData(sandboxProjectId: number): Promise<SandboxProject | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxData = await prismaClient.sandbox_project.findFirst({
			where: {
				sandbox_project_id: sandboxProjectId,
				is_active: true
			},
			select: {
				sandbox_json: true,
				project_uuid: true,
				is_starred: true,
				project_name: true,
				created_at: true,
				updated_at: true,
				project_notes: true,
				sandbox_chat: {
					select: {
						messages: {
							orderBy: {
								created_at: "asc"
							},
							select: {
								message_text: true,
								sender: true,
								created_at: true
							}
						}
					}
				}
			}
		})

		if (isNull(sandboxData)) return null

		return camelCaseSandboxProject({
			...sandboxData,
			project_uuid: sandboxData.project_uuid as ProjectUUID,
			sandbox_json: sandboxData.sandbox_json as BlocklyJson
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
