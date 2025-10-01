import { UserActivityProgress, ActivityUUID } from "@lever-labs/common-ts/types/lab"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserActivityProgressDB(userId: number): Promise<UserActivityProgress[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedActivities = await prismaClient.activity.findMany({
			select: {
				activity_id: true,
				activity_type: true,
				activity_name: true,
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
			activityId: singleActivity.activity_id as ActivityUUID,
			activityName: singleActivity.activity_name,
			activityType: singleActivity.activity_type
		}) satisfies UserActivityProgress)
	} catch (error) {
		console.error(error)
		throw error
	}
}
