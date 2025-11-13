import { isEmpty } from "lodash"
import { Lesson } from "@lever-labs/common-ts/types/quest"
import { LessonUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function getAllLessonsDb(userId: number): Promise<Lesson[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const lessons = await prismaClient.lesson.findMany({
			select: {
				lesson_id: true,
				lesson_name: true,
				lesson_order: true,
				completed_user_lesson: {
					where: { user_id: userId },
					select: { user_id: true },
					take: 1
				}
			},
			orderBy: {
				lesson_order: "asc"
			}
		})

		return lessons.map(lesson => ({
			lessonId: lesson.lesson_id as LessonUUID,
			lessonName: lesson.lesson_name,
			lessonOrder: lesson.lesson_order as number,
			isCompleted: !isEmpty(lesson.completed_user_lesson)
		}) satisfies Lesson)
	} catch (error) {
		console.error(error)
		throw error
	}
}
