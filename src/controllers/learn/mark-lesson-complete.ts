import { Response, Request } from "express"
import markLessonCompleteDb from "../../db-operations/write/lesson/mark-lesson-complete-db"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"

export default async function markLessonComplete(req: Request, res: Response): Promise<void> {
	try {
		const { userId, lessonId } = req

		await markLessonCompleteDb(userId, lessonId)

		res.status(200).json({ success: "Lesson marked as complete" } satisfies SuccessResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to mark lesson as complete" } satisfies ErrorResponse)
		return
	}
}
