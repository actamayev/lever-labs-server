import PrismaClientClass from "../../../classes/prisma-client"

export default async function markLessonCompleteDb(userId: number, lessonId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.lesson_user_progress.upsert({
			where: {
				user_id_lesson_id: {
					user_id: userId,
					lesson_id: lessonId
				}
			},
			update: {
				is_completed: true,
				completed_at: new Date()
			},
			create: {
				user_id: userId,
				lesson_id: lessonId,
				is_completed: true,
				completed_at: new Date()
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
