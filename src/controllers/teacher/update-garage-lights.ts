import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import updateGarageLightsAllStudentsDB from "../../db-operations/write/student/update-garage-lights-all-students-db"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { isEmpty } from "lodash"
import { turnOffStudentPipLeds } from "../../utils/teacher/turn-off-student-pip"

export default async function updateGarageLightsAllStudents(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { garageLightsStatus } = req.body as { garageLightsStatus: boolean }

		await updateGarageLightsAllStudentsDB(classroomId, garageLightsStatus)

		// Emit WebSocket notification to all students in the classroom
		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitGarageLightsStatusUpdateToStudents(studentUserIds, garageLightsStatus)

		if (isEmpty(studentUserIds)) {
			res.status(200).json({ success: "No students found in classroom" } satisfies SuccessResponse)
			return
		}
		if (!garageLightsStatus) {
			studentUserIds.forEach(studentUserId => {
				turnOffStudentPipLeds(studentUserId)
			})
		}
		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage lights status for all students"
		} satisfies ErrorResponse)
		return
	}
}
