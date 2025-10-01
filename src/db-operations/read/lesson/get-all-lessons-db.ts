import PrismaClientClass from "../../../classes/prisma-client"

export default async function getAllLessonsDb(userId: number): Promise<Lesson[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const lessons = await prismaClient.lesson.findMany({
			select: {
				lesson_uuid: true,
				lesson_name: true,
				lesson_user_progress: {
					where: {
						user_id: userId,
						is_completed: true
					},
					select: { user_id: true },
					take: 1
				}
			},
			orderBy: {
				lesson_id: "asc"
			}
		})

		return lessons.map(lesson => ({
			lessonUuid: lesson.lesson_uuid,
			lessonName: lesson.lesson_name,
			isCompleted: lesson.lesson_user_progress.length > 0
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
