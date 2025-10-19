import { Response, Request } from "express"
import { SuccessResponse, ErrorResponse } from "@lever-labs/common-ts/types/api"
import { ClassCode, HubUUID } from "@lever-labs/common-ts/types/utils"
import { UpdatedHubSlideId } from "@lever-labs/common-ts/types/socket"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"

export default async function setHubNewSlideId(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { hubId, newSlideId } = req.body as { hubId: HubUUID, newSlideId: string }
		const { classCode } = req.params as { classCode: ClassCode }

		const hubManager = await HubManager.getInstance()
		await hubManager.setSlideId(hubId, newSlideId)

		const updatedHubInfo: UpdatedHubSlideId = { classCode, hubId, newSlideId }

		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitUpdatedHubToStudents(studentUserIds, updatedHubInfo)

		res.status(200).json({ success: "Hub new slide id set" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set hub new slide id" } satisfies ErrorResponse)
		return
	}
}
