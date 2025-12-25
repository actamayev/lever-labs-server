import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function checkSandboxProjectShareExists(
	projectUUID: SandboxProjectUUID,
	userIdSharedWith: number
): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const share = await prismaClient.sandbox_project_shares.findFirst({
			where: {
				project_uuid: projectUUID,
				user_id_shared_with: userIdSharedWith,
				is_active: true
			},
			select: {
				sandbox_project_shares_id: true
			}
		})

		return share !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}

