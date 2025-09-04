import { Response, Request } from "express"
import { ClassCode, ErrorResponse, StudentClassroomData } from "@bluedotrobots/common-ts"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import joinClassroom from "../../db-operations/write/student/join-classroom"
import getTeacherIdsFromClassroom from "../../db-operations/read/classroom-teacher-map/get-teacher-ids-from-classroom"

export default async function joinClass(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req
		const { classCode } = req.params as { classCode: ClassCode }

		const studentClassroomData = await joinClassroom(userId, classroomId)
		const teacherIds = await getTeacherIdsFromClassroom(classroomId)
		void BrowserSocketManager.getInstance().emitStudentJoinedClassroom(teacherIds, classCode, userId)

		res.status(200).json(studentClassroomData satisfies StudentClassroomData)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to join classroom" } satisfies ErrorResponse)
		return
	}
}
