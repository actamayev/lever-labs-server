import { isNull, isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"
import getTeacherApprovalStatus from "../../db-operations/read/teacher/get-teacher-approval-status-and-teacher-id"

export default async function confirmUserIsTeacher(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req

		const teacherInfo = await getTeacherApprovalStatus(userId)

		 if (teacherInfo?.isApproved === false) {
			res.status(400).json({ message: "You have not yet been approved to be a teacher"} satisfies MessageResponse)
			return
		} else if (isUndefined(teacherInfo)) {
			res.status(400).json({ message: "Please apply to be registered as a teacher"} satisfies MessageResponse)
			return
		} else if (isNull(teacherInfo?.isApproved)) {
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
