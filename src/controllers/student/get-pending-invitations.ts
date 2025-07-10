import { Response, Request } from "express"
import { ErrorResponse, StudentClassroomData } from "@bluedotrobots/common-ts"
import retrieveStudentPendingInvitations from "../../db-operations/read/credentials/retrieve-pending-invitations"

export default async function getPendingInvitations(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req

		const studentClasses = await retrieveStudentPendingInvitations(userId)

		res.status(200).json({ ...studentClasses } as StudentClassroomData[])
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to join classroom" } as ErrorResponse)
		return
	}
}
