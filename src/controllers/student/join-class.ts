import { Response, Request } from "express"
import { ErrorResponse, StudentClassroomData } from "@bluedotrobots/common-ts/types/api"
import { ClassCode } from "@bluedotrobots/common-ts/types/utils"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import joinClassroom from "../../db-operations/write/student/join-classroom"
import getTeacherIdFromClassroom from "../../db-operations/read/classroom-teacher-map/get-teacher-id-from-classroom"
import { isUndefined } from "lodash"

export default async function joinClass(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req
		const { classCode } = req.params as { classCode: ClassCode }

		const studentClassroomData = await joinClassroom(userId, classroomId)
		const teacherId = await getTeacherIdFromClassroom(classroomId)
		if (isUndefined(teacherId)) {
			res.status(400).json({ error: "Teacher not found" } satisfies ErrorResponse)
			return
		}
		void BrowserSocketManager.getInstance().emitStudentJoinedClassroom(teacherId, classCode, userId)

		res.status(200).json(studentClassroomData satisfies StudentClassroomData)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to join classroom" } satisfies ErrorResponse)
		return
	}
}
