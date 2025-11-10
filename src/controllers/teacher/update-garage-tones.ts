import { isEmpty } from "lodash"
import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { stopStudentPipTone } from "../../utils/teacher/turn-off-student-pip"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"
import updateGarageTonesAllStudentsDB from "../../db-operations/write/student/update-garage-tones-all-students-db"

export default async function updateGarageTonesAllStudents(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { garageTonesStatus } = req.body as { garageTonesStatus: boolean }

		await updateGarageTonesAllStudentsDB(classroomId, garageTonesStatus)

		// Emit WebSocket notification to all students in the classroom
		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitGarageTonesStatusUpdateToStudents(studentUserIds, garageTonesStatus)

		if (isEmpty(studentUserIds)) {
			res.status(200).json({ success: "No students found in classroom" } satisfies SuccessResponse)
			return
		}
		if (!garageTonesStatus) {
			studentUserIds.forEach(studentUserId => stopStudentPipTone(studentUserId))
		}
		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage tones status for all students"
		} satisfies ErrorResponse)
		return
	}
}
