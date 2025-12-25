import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { TeacherName } from "@actamayev/lever-labs-common-ts/types/teacher"
import updateTeacherName from "../../db-operations/write/teacher/update-teacher-name"

export default async function editTeacherName(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { teacherNameData } = req.body as { teacherNameData: TeacherName }
		await updateTeacherName(userId, teacherNameData)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update teacher name" } satisfies ErrorResponse)
		return
	}
}
