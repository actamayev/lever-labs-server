import { Response, Request } from "express"
import { SuccessResponse, ErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { DeletedHub } from "@actamayev/lever-labs-common-ts/types/socket"
import { ClassCode, HubUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"

export default async function deleteHub(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { hubId } = req.body as { hubId: HubUUID }
		const { classCode } = req.params as { classCode: ClassCode }

		const hubManager = await HubManager.getInstance()
		await hubManager.deleteHub(hubId)

		const deletedHubInfo: DeletedHub = { classCode, hubId }

		const studentUserIds = await getClassroomStudentIds(classroomId)
		BrowserSocketManager.getInstance().emitDeletedHubToStudents(studentUserIds, deletedHubInfo)

		res.status(200).json({ success: "Hub deleted" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete hub" } satisfies ErrorResponse)
		return
	}
}
