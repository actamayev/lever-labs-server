import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import updateIndividualStudentGarageLightsDB from "../../db-operations/write/student/update-individual-student-garage-lights-db"
import getStudentUserId from "../../db-operations/read/student/get-student-user-id"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default async function updateIndividualStudentGarageLights(req: Request, res: Response): Promise<void> {
	try {
		const { studentId, garageLightsStatus } = req.body as { studentId: number, garageLightsStatus: boolean }

		await updateIndividualStudentGarageLightsDB(studentId, garageLightsStatus)

		// Emit WebSocket notification to the specific student
		const studentUserId = await getStudentUserId(studentId)
		if (studentUserId) {
			BrowserSocketManager.getInstance().emitGarageLightsStatusUpdateToStudents([studentUserId], garageLightsStatus)
		}

		// TODO: If the garagelights are being turned on, we need to turn on the lights for the student.
		// Same for motors, and sounds (add a WS event on the ESP side to stop the sound)
		// Alsdo do this for the endpoints where all of the students robots are being updated.

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update garage lights status for individual student"
		} satisfies ErrorResponse)
		return
	}
}
