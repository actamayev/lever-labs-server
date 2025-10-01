import { isEmpty } from "lodash"
import { Lesson } from "@lever-labs/common-ts/types/learn"
import { LessonUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function getAllLessonsDb(userId: number): Promise<Lesson[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const lessons = await prismaClient.lesson.findMany({
			select: {
				lesson_uuid: true,
				lesson_name: true,
				completed_user_lesson: {
					where: { user_id: userId },
					select: { user_id: true },
					take: 1
				}
			},
			orderBy: {
				lesson_id: "asc"
			}
		})

		return lessons.map(lesson => ({
			lessonUuid: lesson.lesson_uuid as LessonUUID,
			lessonName: lesson.lesson_name,
			isCompleted: !isEmpty(lesson.completed_user_lesson)
		}) satisfies Lesson)
	} catch (error) {
		console.error(error)
		throw error
	}
}
