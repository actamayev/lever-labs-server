import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import updateIndividualStudentGarageTonesDB from "../../db-operations/write/student/update-individual-student-garage-tones-db"
import getStudentUserId from "../../db-operations/read/student/get-student-user-id"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { stopStudentPipTone } from "../../utils/teacher/turn-off-student-pip"

export default async function updateIndividualStudentGarageTones(req: Request, res: Response): Promise<void> {
	try {
		const { studentId, garageTonesStatus } = req.body as { studentId: number, garageTonesStatus: boolean }

		await updateIndividualStudentGarageTonesDB(studentId, garageTonesStatus)

		// Emit WebSocket notification to the specific student
		const studentUserId = await getStudentUserId(studentId)
		if (!studentUserId) {
			res.status(200).json({ success: "Student user ID not found" } satisfies SuccessResponse)
			return
		}

		BrowserSocketManager.getInstance().emitGarageTonesStatusUpdateToStudents([studentUserId], garageTonesStatus)
		if (!garageTonesStatus) stopStudentPipTone(studentUserId)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to update individual student garage tones status"
		} satisfies ErrorResponse)
		return
	}
}
