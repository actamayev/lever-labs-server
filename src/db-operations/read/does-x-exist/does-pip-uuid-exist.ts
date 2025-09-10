import PrismaClientClass from "../../../classes/prisma-client"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

export default async function doesPipUUIDExist(pipUUID: PipUUID): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const pipUUIDData = await prismaClient.pip_uuid.findFirst({
			where: {
				uuid: pipUUID
			},
			select: {
				pip_uuid_id: true
			}
		})

		return pipUUIDData !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
