import { isNull } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"
import getTeacherApprovalStatus from "../../db-operations/read/teacher/get-teacher-approval-status"

export default async function confirmUserIsNotTeacher(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req

		const teacherApproved = await getTeacherApprovalStatus(userId)

		if (teacherApproved === true) {
			res.status(400).json({ message: "You have already been approved to be a teacher"} satisfies MessageResponse)
			return
		} else if (teacherApproved === false) {
			res.status(400).json({
				message: "Your application to be a teacher was not accepted. Please contact our support team"
			} satisfies MessageResponse)
			return
		} else if (isNull(teacherApproved)) {
			res.status(400).json({ message: "Your application to be a teacher is still being processed." } satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user isn't an approved teacher" } satisfies ErrorResponse)
		return
	}
}
