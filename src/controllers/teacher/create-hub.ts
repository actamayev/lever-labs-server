import { randomUUID } from "crypto"
import { Response, Request } from "express"
import { ErrorResponse, ClassCode, CareerUUID, StudentViewHubData, CreateHubRequest } from "@bluedotrobots/common-ts"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"

export default async function createHub(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req
		const { classCode } = req.params as { classCode: ClassCode }
		const { hubName, careerUUID, slideId } = req.body as { hubName: string, careerUUID: CareerUUID, slideId: string }
		const studentIds = await getClassroomStudentIds(classroomId)

		const hubId = randomUUID()
		HubManager.getInstance().createHub(hubId, { teacherId: userId, hubName, classCode, careerUUID, slideId, studentsJoined: [], hubId })

		const hubInfo: StudentViewHubData = { hubId, classCode, careerUUID, slideId, hubName }
		void BrowserSocketManager.getInstance().emitNewHubToStudents(studentIds, hubInfo)

		res.status(200).json({ hubId } satisfies CreateHubRequest)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create hub" } satisfies ErrorResponse)
		return
	}
}
