import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function removeSandboxProjectShare(projectUUID: SandboxProjectUUID, userIdToUnshareWith: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_project_shares.updateMany({
			where: {
				project_uuid: projectUUID,
				user_id_shared_with: userIdToUnshareWith
			},
			data: {
				is_active: false
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
