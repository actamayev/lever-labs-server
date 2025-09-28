import { isEmpty } from "lodash"
import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import updateGarageDisplayAllStudentsDB from "../../db-operations/write/student/update-garage-display-all-students-db"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { resetStudentPipDisplay } from "../../utils/teacher/turn-off-student-pip"

export default async function updateGarageDisplayAllStudents(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { garageDisplayStatus } = req.body as { garageDisplayStatus: boolean }

		await updateGarageDisplayAllStudentsDB(classroomId, garageDisplayStatus)

		// Emit WebSocket notification to all students in the classroom
		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitGarageDisplayStatusUpdateToStudents(studentUserIds, garageDisplayStatus)

		if (isEmpty(studentUserIds)) {
			res.status(200).json({ success: "No students found in classroom" } satisfies SuccessResponse)
			return
		}
		if (!garageDisplayStatus) {
			studentUserIds.forEach(studentUserId => {
				resetStudentPipDisplay(studentUserId)
			})
		}
		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage display status for all students"
		} satisfies ErrorResponse)
		return
	}
}
