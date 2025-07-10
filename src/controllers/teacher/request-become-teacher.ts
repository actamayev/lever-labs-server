import { Response, Request } from "express"
import { ErrorResponse, IncomingTeacherRequestData, SuccessResponse } from "@bluedotrobots/common-ts"
import addTeacherUpdateUser from "../../db-operations/write/simultaneous-writes/add-teacher-update-user"

export default async function requestBecomeTeacher(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const becomeTeacherData = req.body as IncomingTeacherRequestData
		await addTeacherUpdateUser(userId, becomeTeacherData)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create classroom" } as ErrorResponse)
		return
	}
}
