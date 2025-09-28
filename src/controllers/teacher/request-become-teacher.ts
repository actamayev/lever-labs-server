import { Response, Request } from "express"
import { ErrorResponse, IncomingTeacherRequestData, SuccessResponse } from "@lever-labs/common-ts/types/api"
import addTeacher from "../../db-operations/write/simultaneous-writes/add-teacher"

export default async function requestBecomeTeacher(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { teacherRequestData } = req.body as { teacherRequestData: IncomingTeacherRequestData }
		await addTeacher(userId, teacherRequestData)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to request to become a teacher" } satisfies ErrorResponse)
		return
	}
}
