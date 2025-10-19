import { randomUUID } from "crypto"
import { Response, Request } from "express"
import { ErrorResponse, CreateHubRequest } from "@lever-labs/common-ts/types/api"
import { ClassCode, HubUUID,  CareerUUID } from "@lever-labs/common-ts/types/utils"
import { StudentViewHubData } from "@lever-labs/common-ts/types/hub"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import getClassroomStudentIds from "../../db-operations/read/classroom/get-classroom-student-ids"

export default async function createHub(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req
		const { classCode } = req.params as { classCode: ClassCode }
		const { hubName, careerUUID, slideId } = req.body as { hubName: string, careerUUID: CareerUUID, slideId: string }
		const studentUserIds = await getClassroomStudentIds(classroomId)

		const hubId = randomUUID() as HubUUID
		const hubManager = await HubManager.getInstance()
		await hubManager.createHub(hubId,
			{ teacherId: userId, hubName, classCode, careerUUID, slideId, studentsJoined: [] }
		)

		const hubInfo: StudentViewHubData = { hubId, classCode, careerUUID, slideId, hubName }
		BrowserSocketManager.getInstance().emitNewHubToStudents(studentUserIds, hubInfo)

		res.status(200).json({ hubId } satisfies CreateHubRequest)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create hub" } satisfies ErrorResponse)
		return
	}
}
