import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getStudentUserId from "../../db-operations/read/student/get-student-user-id"
import updateIndividualStudentGarageLightsDB from "../../db-operations/write/student/update-individual-student-garage-lights-db"

export default async function updateIndividualStudentGarageLights(req: Request, res: Response): Promise<void> {
	try {
		const { studentId, garageLightsStatus } = req.body as { studentId: number, garageLightsStatus: boolean }

		await updateIndividualStudentGarageLightsDB(studentId, garageLightsStatus)

		// Emit WebSocket notification to the specific student
		const studentUserId = await getStudentUserId(studentId)
		if (!studentUserId) {
			res.status(200).json({ success: "Student user ID not found" } satisfies SuccessResponse)
			return
		}

		BrowserSocketManager.getInstance().emitGarageLightsStatusUpdateToStudents([studentUserId], garageLightsStatus)

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
