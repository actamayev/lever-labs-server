import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { ClassCode, HubUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { StudentLeftHub } from "@actamayev/lever-labs-common-ts/types/socket"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import HubManager from "../../classes/hub-manager"
import getTeacherIdFromClassroom from "../../db-operations/read/classroom-teacher-map/get-teacher-id-from-classroom"
import { isUndefined } from "lodash"

export default async function leaveHub(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req
		const { hubId } = req.body as { hubId: HubUUID }
		const { classCode } = req.params as { classCode: ClassCode }
		const hubManager = await HubManager.getInstance()
		await hubManager.removeStudentFromHub(hubId, userId)

		const teacherId = await getTeacherIdFromClassroom(classroomId)
		if (isUndefined(teacherId)) {
			res.status(400).json({ error: "Teacher not found" } satisfies ErrorResponse)
			return
		}
		const data: StudentLeftHub = { classCode, hubId, studentUserId: userId }
		BrowserSocketManager.getInstance().emitStudentLeftHub(teacherId, data)

		res.status(200).json({ success: "Student left hub" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to leave hub" } satisfies ErrorResponse)
		return
	}
}
