import { UUID } from "crypto"
import { Response, Request } from "express"
import { SuccessResponse, ErrorResponse, ClassCode, UpdatedHubSlideId } from "@bluedotrobots/common-ts"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"

export default async function setHubNewSlideId(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { hubId, newSlideId } = req.body as { hubId: UUID, newSlideId: string }
		const { classCode } = req.params as { classCode: ClassCode }

		HubManager.getInstance().setSlideId(hubId, newSlideId)

		const updatedHubInfo: UpdatedHubSlideId = { classCode, hubId, newSlideId }

		const studentIds = await getClassroomStudentIds(classroomId)
		void BrowserSocketManager.getInstance().emitUpdatedHubToStudents(studentIds, updatedHubInfo)

		res.status(200).json({ success: "Hub new slide id set" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set hub new slide id" } satisfies ErrorResponse)
		return
	}
}
