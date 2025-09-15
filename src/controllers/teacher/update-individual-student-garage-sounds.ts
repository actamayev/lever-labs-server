import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import updateIndividualStudentGarageSoundsDB from "../../db-operations/write/student/update-individual-student-garage-sounds-db"
import getStudentUserId from "../../db-operations/read/student/get-student-user-id"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { stopStudentPipSound } from "../../utils/teacher/turn-off-student-pip"

export default async function updateIndividualStudentGarageSounds(req: Request, res: Response): Promise<void> {
	try {
		const { studentId, garageSoundsStatus } = req.body as { studentId: number, garageSoundsStatus: boolean }

		await updateIndividualStudentGarageSoundsDB(studentId, garageSoundsStatus)

		// Emit WebSocket notification to the specific student
		const studentUserId = await getStudentUserId(studentId)
		if (!studentUserId) {
			res.status(200).json({ success: "Student user ID not found" } satisfies SuccessResponse)
			return
		}
		BrowserSocketManager.getInstance().emitGarageSoundsStatusUpdateToStudents([studentUserId], garageSoundsStatus)
		stopStudentPipSound(studentUserId)
		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage sounds status for individual student"
		} satisfies ErrorResponse)
		return
	}
}
