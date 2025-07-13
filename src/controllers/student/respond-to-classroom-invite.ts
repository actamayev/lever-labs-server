import { Response, Request } from "express"
import { ErrorResponse, InviteResponse, SuccessResponse } from "@bluedotrobots/common-ts"
import respondToClassInvite from "../../db-operations/write/student/respond-to-class-invite"

export default async function respondToClassroomInvite(req: Request, res: Response): Promise<void> {
	try {
		const { studentId } = req
		const { inviteResponse } = req.body as InviteResponse

		await respondToClassInvite(studentId, inviteResponse)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to respond to classroom invite" } satisfies ErrorResponse)
		return
	}
}
