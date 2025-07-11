import { Response, Request } from "express"
import { BasicTeacherClassroomData, ErrorResponse } from "@bluedotrobots/common-ts"
import getTeacherClassrooms from "../../db-operations/read/classroom-teacher-map/get-teacher-classrooms"

export default async function retrieveBasicClassroomInfo(req: Request, res: Response): Promise<void> {
	try {
		const { teacherId } = req
		const classrooms = await getTeacherClassrooms(teacherId)

		res.status(200).json({ ...classrooms } as BasicTeacherClassroomData[])
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create classroom" } satisfies ErrorResponse)
		return
	}
}
