import { isNull } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@lever-labs/common-ts/types/api"
import getTeacherApprovalStatus from "../../db-operations/read/teacher/get-teacher-approval-status-and-teacher-id"

// confirmUserIsTeacher
export default async function attachTeacherId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req

		const teacherInfo = await getTeacherApprovalStatus(userId)

		if (isNull(teacherInfo)) {
			res.status(400).json({ message: "Please apply to be registered as a teacher"} satisfies MessageResponse)
			return
		} else if (teacherInfo.isApproved === false) {
			res.status(400).json({ message: "Your request to be a teacher was denied"} satisfies MessageResponse)
			return
		} else if (isNull(teacherInfo.isApproved)) {
			res.status(400).json({ message: "Your application to be a teacher is still being processed." } satisfies MessageResponse)
			return
		}
		req.teacherId = teacherInfo.teacherId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm if user is an approved teacher" } satisfies ErrorResponse)
		return
	}
}
