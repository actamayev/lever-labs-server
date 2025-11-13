import { BlocklyJson, SandboxProject } from "@lever-labs/common-ts/types/sandbox"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

// eslint-disable-next-line max-lines-per-function
export default async function retrieveUserSandboxProjectData(userId: number): Promise<SandboxProject[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const sandboxProjects = await prismaClient.sandbox_project.findMany({
			where: {
				OR: [
					{ project_owner_id: userId },
					{
						sandbox_project_shares: {
							some: {
								user_id_shared_with: userId,
								is_active: true
							}
						}
					}
				],
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
				},
				sandbox_chat: {
					where: {
						is_active: true
					},
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
					},
					take: 1
				},
				sandbox_project_shares: {
					where: {
						is_active: true
					},
					select: {
						user: {
							select: {
								user_id: true,
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
				}
			}
		})

		return sandboxProjects.map(sandboxProject =>
			camelCaseSandboxProject(
				{
					...sandboxProject,
					project_uuid: sandboxProject.project_uuid as SandboxProjectUUID,
					sandbox_json: sandboxProject.sandbox_json as BlocklyJson,
					sandbox_chat: sandboxProject.sandbox_chat[0] || null
				},
				userId
			)
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}
