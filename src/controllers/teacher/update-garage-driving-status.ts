import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import updateGarageDrivingStatusAllStudentsDB from "../../db-operations/write/student/update-garage-driving-status-all-students-db"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default async function updateGarageDrivingStatusAllStudents(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { garageDrivingStatus } = req.body as { garageDrivingStatus: boolean }

		await updateGarageDrivingStatusAllStudentsDB(classroomId, garageDrivingStatus)

		// Emit WebSocket notification to all students in the classroom
		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitGarageDrivingStatusUpdateToStudents(studentUserIds, garageDrivingStatus)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage driving status for all students"
		} satisfies ErrorResponse)
		return
	}
}
