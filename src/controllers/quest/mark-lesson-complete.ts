import { Response, Request } from "express"
import createCompletedUserLessonRecordDb from "../../db-operations/write/completed-user-lesson/create-completed-user-lesson-record"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { LessonUUID } from "@actamayev/lever-labs-common-ts/types/utils"

export default async function markLessonComplete(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { lessonId } = req.params as { lessonId: LessonUUID }

		await createCompletedUserLessonRecordDb(userId, lessonId)

		res.status(200).json({ success: "Lesson marked as complete" } satisfies SuccessResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to mark lesson as complete" } satisfies ErrorResponse)
		return
	}
}
