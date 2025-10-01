import { Response, Request } from "express"
import getSingleLessonDb from "../../db-operations/read/lesson/get-single-lesson-db"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"

export default async function getSingleLesson(req: Request, res: Response): Promise<void> {
	try {
		const { lessonId } = req

		const lesson = await getSingleLessonDb(lessonId)

		if (!lesson) {
			res.status(500).json({ error: "Lesson not found" } satisfies ErrorResponse)
			return
		}

		res.status(200).json({ lesson } satisfies LessonResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve lesson" } satisfies ErrorResponse)
		return
	}
}
