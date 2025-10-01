import PrismaClientClass from "../../../classes/prisma-client"

export default async function getAllLessonsDb(): Promise<Lesson[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const lessons = await prismaClient.lesson.findMany({
			select: {
				lesson_uuid: true,
				lesson_name: true,
			},
			orderBy: {
				lesson_id: "asc"
			}
		})

		return lessons.map(lesson => ({
			lessonUuid: lesson.lesson_uuid,
			lessonName: lesson.lesson_name
		}) satisfies Lesson)
	} catch (error) {
		console.error(error)
		throw error
	}
}
