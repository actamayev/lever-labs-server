import { UUID } from "crypto"
import { Response, Request } from "express"
import { SuccessResponse, ErrorResponse, ClassCode, DeletedHub } from "@bluedotrobots/common-ts"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"

export default async function deleteHub(req: Request, res: Response): Promise<void> {
	try {
		const { classroomId } = req
		const { hubId } = req.body as { hubId: UUID }
		const { classCode } = req.params as { classCode: ClassCode }

		HubManager.getInstance().deleteHub(hubId)

		const deletedHubInfo: DeletedHub = { classCode, hubId }

		const studentIds = await getClassroomStudentIds(classroomId)
		void BrowserSocketManager.getInstance().emitDeletedHubToStudents(studentIds, deletedHubInfo)

		res.status(200).json({ success: "Hub deleted" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete hub" } satisfies ErrorResponse)
		return
	}
}
