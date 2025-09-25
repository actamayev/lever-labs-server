import { isEmpty } from "lodash"
import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { stopStudentPipSound } from "../../utils/teacher/turn-off-student-pip"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"
import updateGarageSoundsAllStudentsDB from "../../db-operations/write/student/update-garage-sounds-all-students-db"

export default async function updateGarageSoundsAllStudents(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { garageSoundsStatus } = req.body as { garageSoundsStatus: boolean }

		await updateGarageSoundsAllStudentsDB(classroomId, garageSoundsStatus)

		// Emit WebSocket notification to all students in the classroom
		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitGarageSoundsStatusUpdateToStudents(studentUserIds, garageSoundsStatus)

		if (isEmpty(studentUserIds)) {
			res.status(200).json({ success: "No students found in classroom" } satisfies SuccessResponse)
			return
		}
		if (!garageSoundsStatus) {
			studentUserIds.forEach(studentUserId => {
				stopStudentPipSound(studentUserId)
			})
		}
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
