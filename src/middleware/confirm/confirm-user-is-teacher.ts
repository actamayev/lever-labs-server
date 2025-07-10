import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"
import getTeacherApprovalStatus from "../../db-operations/read/teacher/get-teacher-approval-status"

export default async function confirmUserIsTeacher(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req

		const teacherApproved = await getTeacherApprovalStatus(userId)

		if (isUndefined(teacherApproved)) {
			res.status(400).json({ message: "Please apply to be registered as a teacher"} as MessageResponse)
			return
		}

		if (teacherApproved === false) {
			res.status(400).json({ message: "You have not yet been approved to be a teacher"} as MessageResponse)
			return
		}
		req.teacherId = userId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm if user is an approved teacher" } as ErrorResponse)
		return
	}
}
