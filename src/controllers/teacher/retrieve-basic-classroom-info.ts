import { Response, Request } from "express"
import { BasicTeacherClassroomData, ErrorResponse } from "@lever-labs/common-ts/types/api"
import getTeacherClassrooms from "../../db-operations/read/classroom-teacher-map/get-teacher-classrooms"

export default async function retrieveBasicClassroomInfo(req: Request, res: Response): Promise<void> {
	try {
		const { teacherId } = req
		const classrooms = await getTeacherClassrooms(teacherId)

		res.status(200).json(classrooms satisfies BasicTeacherClassroomData[])
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve basic classroom info" } satisfies ErrorResponse)
		return
	}
}
