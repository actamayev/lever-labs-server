import { ActivityUUID } from "@lever-labs/common-ts/types/lab"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function markActivityCompleteDb(userId: number, activityId: ActivityUUID): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.user_activity_progress.upsert({
			where: {
				user_id_activity_id: {
					user_id: userId,
					activity_id: activityId
				}
			},
			update: {
				status: "COMPLETED",
				completed_at: new Date()
			},
			create: {
				status: "COMPLETED",
				user_id: userId,
				activity_id: activityId,
				completed_at: new Date()
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
