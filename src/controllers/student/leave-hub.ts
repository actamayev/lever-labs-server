import { Response, Request } from "express"
import { ClassCode, ErrorResponse, StudentJoinedOrLeftHub, SuccessResponse } from "@bluedotrobots/common-ts"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import { UUID } from "crypto"
import HubManager from "../../classes/hub-manager"
import getTeacherIdsFromClassroom from "../../db-operations/read/classroom-teacher-map/get-teacher-ids-from-classroom"
import retrieveUsername from "../../db-operations/read/credentials/retrieve-username"

export default async function leaveHub(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req
		const { hubId } = req.body as { hubId: UUID }
		const { classCode } = req.params as { classCode: ClassCode }

		const username = await retrieveUsername(userId)
		HubManager.getInstance().removeStudentFromHub(hubId, userId)

		const teacherIds = await getTeacherIdsFromClassroom(classroomId)
		const data: StudentJoinedOrLeftHub = { classCode, hubId, studentUsername: username || "" }
		BrowserSocketManager.getInstance().emitStudentLeftHub(teacherIds, data)

		res.status(200).json({ success: "Student left hub" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to leave hub" } satisfies ErrorResponse)
		return
	}
}
