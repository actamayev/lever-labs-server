import PrismaClientClass from "../../../classes/prisma-client"

export default async function findLessonIdFromUuid(lessonUuid: string): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const lesson = await prismaClient.lesson.findUnique({
			where: {
				lesson_uuid: lessonUuid
			},
			select: {
				lesson_id: true
			}
		})

		return lesson?.lesson_id || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
