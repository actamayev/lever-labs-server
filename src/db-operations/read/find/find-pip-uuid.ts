import { pip_uuid } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function findPipUUID(pipUUID: string): Promise<pip_uuid | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const pipUUIDRecord = await prismaClient.pip_uuid.findFirst({
			where: {
				uuid: pipUUID
			}
		})

		return pipUUIDRecord
	} catch (error) {
		console.error(error)
		throw error
	}
}
