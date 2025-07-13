import { InvitationStatus } from "@prisma/client"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"
import retrieveStudentInviteStatus from "../../db-operations/read/student/retrieve-student-invite-status"

export default async function confirmStudentInvitedToClass(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { studentId } = req

		const inviteStatus = await retrieveStudentInviteStatus(studentId)

		if (inviteStatus !== InvitationStatus.PENDING) {
			res.status(400).json({ message: "You have already responded to this invite" } satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user is not already in class" } satisfies ErrorResponse)
		return
	}
}
