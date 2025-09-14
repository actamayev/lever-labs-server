import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import updateGarageSoundsAllStudentsDB from "../../db-operations/write/student/update-garage-sounds-all-students-db"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default async function updateGarageSoundsAllStudents(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { garageSoundsStatus } = req.body as { garageSoundsStatus: boolean }

		await updateGarageSoundsAllStudentsDB(classroomId, garageSoundsStatus)

		// Emit WebSocket notification to all students in the classroom
		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitGarageSoundsStatusUpdateToStudents(studentUserIds, garageSoundsStatus)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage sounds status for all students"
		} satisfies ErrorResponse)
		return
	}
}
