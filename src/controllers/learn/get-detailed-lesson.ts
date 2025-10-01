import { Response, Request } from "express"
import { ErrorResponse, DetailedLessonResponse } from "@lever-labs/common-ts/types/api"
import getDetailedLessonDb from "../../db-operations/read/lesson/get-detailed-lesson-db"

export default async function getDetailedLesson(req: Request, res: Response): Promise<void> {
	try {
		const { lessonId, userId } = req

		const lesson = await getDetailedLessonDb(lessonId, userId)

		if (!lesson) {
			res.status(500).json({ error: "Lesson not found" } satisfies ErrorResponse)
			return
		}

		res.status(200).json({ lesson } satisfies DetailedLessonResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve lesson" } satisfies ErrorResponse)
		return
	}
}
