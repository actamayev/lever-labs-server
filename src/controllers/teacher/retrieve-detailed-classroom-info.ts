import { Response, Request } from "express"
import { DetailedClassroomData, ErrorResponse} from "@bluedotrobots/common-ts"
import getDetailedTeacherClassroomData from "../../db-operations/read/classroom-teacher-map/get-detailed-teacher-classroom-data"

export default async function retrieveDetailedClassroomInfo(req: Request, res: Response): Promise<void> {
	try {
		const { teacherId } = req
		const detailedClassroomInfo = await getDetailedTeacherClassroomData(teacherId)

		res.status(200).json({ ...detailedClassroomInfo } as DetailedClassroomData[])
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve detailed classroom info" } as ErrorResponse)
		return
	}
}
