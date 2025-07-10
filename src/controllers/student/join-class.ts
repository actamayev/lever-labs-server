import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts"
import joinClassroom from "../../db-operations/write/student/join-classroom"

export default async function joinClass(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req

		await joinClassroom(userId, classroomId)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to join classroom" } as ErrorResponse)
		return
	}
}
