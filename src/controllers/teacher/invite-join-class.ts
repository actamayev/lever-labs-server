import { isUndefined } from "lodash"
import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"
import addStudent from "../../db-operations/write/student/add-student"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getTeacherName from "../../db-operations/read/teacher/get-teacher-name"
import getClassroomName from "../../db-operations/read/classroom/get-classroom-name"

export default async function inviteStudentJoinClass(req: Request, res: Response): Promise<void> {
	try {
		const { teacherId, classroomId, studentId } = req
		// TODO: Add a WS command to invite the user
		await addStudent(teacherId, classroomId, studentId)
		const teacherName = await getTeacherName(teacherId)
		const classroomName = await getClassroomName(classroomId)

		if (isUndefined(teacherName) || isUndefined(classroomName)) {
			res.status(500).json({ error: "Unable to find teacher or classroom name" } as ErrorResponse)
			return
		}
		void BrowserSocketManager.getInstance().emitStudentInviteJoinClass(studentId, teacherName, classroomName)
		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to invite student to join class" } as ErrorResponse)
		return
	}
}
