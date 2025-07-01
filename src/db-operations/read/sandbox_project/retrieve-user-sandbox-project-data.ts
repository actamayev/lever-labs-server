import { SandboxProject } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

export default async function retrieveUserSandboxProjectData(userId: number): Promise<SandboxProject[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProjects = await prismaClient.sandbox_project.findMany({
			where: {
				project_owner_id: userId,
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

		return sandboxProjects.map(sandboxProject => camelCaseSandboxProject(sandboxProject))
	} catch (error) {
		console.error(error)
		throw error
	}
}
