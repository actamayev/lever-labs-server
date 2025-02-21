import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserActivityProgressDB(userId: number): Promise<UserActivityProgress[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedUserActivityProgress = await prismaClient.user_activity_progress.findMany({
			where: {
				user_id: userId
			},
			select: {
				status: true,
				activity: {
					select: {
						activity_uuid: true
					}
				}
			}
		})

		return retrievedUserActivityProgress.map(singleProgress => ({
			status: singleProgress.status,
			activityUUID: singleProgress.activity.activity_uuid as ActivityUUID
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
