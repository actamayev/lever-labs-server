import { Response, Request } from "express"
import { ErrorResponse, DetailedLessonResponse } from "@lever-labs/common-ts/types/api"
import getDetailedLessonDb from "../../db-operations/read/lesson/get-detailed-lesson-db"
import { LessonUUID } from "@lever-labs/common-ts/types/utils"

export default async function getDetailedLesson(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { lessonId } = req.params as { lessonId: LessonUUID }

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
