import { ActivityUUID } from "@bluedotrobots/common-ts/types/lab"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function findActivityIdFromUUID(activityUUID: ActivityUUID): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedActivity = await prismaClient.activity.findFirst({
			where: {
				activity_uuid: activityUUID
			}
		})

		return retrievedActivity?.activity_id || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
