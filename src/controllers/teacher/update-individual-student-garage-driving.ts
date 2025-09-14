import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import updateIndividualStudentGarageDrivingDB from "../../db-operations/write/student/update-individual-student-garage-driving-db"
import getStudentUserId from "../../db-operations/read/student/get-student-user-id"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default async function updateIndividualStudentGarageDriving(req: Request, res: Response): Promise<void> {
	try {
		const { studentId, garageDrivingStatus } = req.body as { studentId: number, garageDrivingStatus: boolean }

		await updateIndividualStudentGarageDrivingDB(studentId, garageDrivingStatus)

		// Emit WebSocket notification to the specific student
		const studentUserId = await getStudentUserId(studentId)
		if (studentUserId) {
			BrowserSocketManager.getInstance().emitGarageDrivingStatusUpdateToStudents([studentUserId], garageDrivingStatus)
		}

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage driving status for individual student"
		} satisfies ErrorResponse)
		return
	}
}
