import { isNull } from "lodash"
import { Response, Request } from "express"
import { DetailedClassroomData, ErrorResponse} from "@lever-labs/common-ts/types/api"
import getDetailedTeacherClassroomData from "../../db-operations/read/classroom-teacher-map/get-detailed-teacher-classroom-data"

export default async function retrieveDetailedClassroomInfo(req: Request, res: Response): Promise<void> {
	try {
		const { teacherId, userId, classroomId } = req
		const detailedClassroomInfo = await getDetailedTeacherClassroomData(teacherId, userId, classroomId)

		if (isNull(detailedClassroomInfo)) {
			res.status(500).json({ error: "Classroom not found" } satisfies ErrorResponse)
			return
		}

		res.status(200).json(detailedClassroomInfo satisfies DetailedClassroomData)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve detailed classroom info" } satisfies ErrorResponse)
		return
	}
}
