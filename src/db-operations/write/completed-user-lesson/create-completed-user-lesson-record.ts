import PrismaClientClass from "../../../classes/prisma-client"

export default async function createCompletedUserLessonRecordDb(userId: number, lessonId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.completed_user_lesson.create({
			data: {
				user_id: userId,
				lesson_id: lessonId
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
