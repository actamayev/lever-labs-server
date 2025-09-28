import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import updateIndividualStudentGarageDisplayDB from "../../db-operations/write/student/update-individual-student-garage-display-db"
import getStudentUserId from "../../db-operations/read/student/get-student-user-id"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { resetStudentPipDisplay } from "../../utils/teacher/turn-off-student-pip"

export default async function updateIndividualStudentGarageDisplay(req: Request, res: Response): Promise<void> {
	try {
		const { studentId, garageDisplayStatus } = req.body as { studentId: number, garageDisplayStatus: boolean }

		await updateIndividualStudentGarageDisplayDB(studentId, garageDisplayStatus)

		// Emit WebSocket notification to the specific student
		const studentUserId = await getStudentUserId(studentId)
		if (!studentUserId) {
			res.status(200).json({ success: "Student user ID not found" } satisfies SuccessResponse)
			return
		}

		BrowserSocketManager.getInstance().emitGarageDisplayStatusUpdateToStudents([studentUserId], garageDisplayStatus)
		if (!garageDisplayStatus) {
			resetStudentPipDisplay(studentUserId)
		}
		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage display status for individual student"
		} satisfies ErrorResponse)
		return
	}
}
