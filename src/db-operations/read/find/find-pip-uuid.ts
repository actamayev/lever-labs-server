import { pip_uuid } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"
import { PipUUID } from "@bluedotrobots/common-ts"

export default async function findPipUUID(pipUUID: PipUUID): Promise<pip_uuid | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		return await prismaClient.pip_uuid.findFirst({
			where: {
				uuid: pipUUID
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
