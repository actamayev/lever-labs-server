import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function upsertSandboxProjectShare(
	projectUUID: SandboxProjectUUID,
	userIdSharedWith: number
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project_shares.upsert({
			where: {
				project_uuid_user_id_shared_with: {
					project_uuid: projectUUID,
					user_id_shared_with: userIdSharedWith
				}
			},
			update: {
				is_active: true
			},
			create: {
				project_uuid: projectUUID,
				user_id_shared_with: userIdSharedWith,
				is_active: true
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}

