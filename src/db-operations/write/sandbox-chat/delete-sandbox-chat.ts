import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function deleteSandboxChat(sandboxProjectUUID: SandboxProjectUUID): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.sandbox_chat.updateMany({
			where: {
				project_uuid: sandboxProjectUUID,
				is_active: true
			},
			data: {
				is_active: false
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
