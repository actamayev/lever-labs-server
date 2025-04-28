import { ActivityUUID, UserActivityProgress } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserActivityProgressDB(userId: number): Promise<UserActivityProgress[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedActivities = await prismaClient.activity.findMany({
			select: {
				activity_type: true,
				activity_name: true,
				activity_uuid: true,
				user_activity_progress: {
					where: {
						user_id: userId
					},
					select: {
						status: true
					},
					take: 1
				}
			}
		})

		return retrievedActivities.map(singleActivity => ({
			status: singleActivity.user_activity_progress[0]?.status ?? null,
			activityUUID: singleActivity.activity_uuid as ActivityUUID,
			activityName: singleActivity.activity_name,
			activityType: singleActivity.activity_type
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
