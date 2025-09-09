import { Response, Request } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts/types/api"
import { StudentViewHubData } from "@bluedotrobots/common-ts/types/hub"
import { HubUUID, ClassCode } from "@bluedotrobots/common-ts/types/utils"
import { StudentJoinedHub } from "@bluedotrobots/common-ts/types/socket"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import retrieveUsername from "../../db-operations/read/credentials/retrieve-username"
import getTeacherIdFromClassroom from "../../db-operations/read/classroom-teacher-map/get-teacher-id-from-classroom"
import { isUndefined } from "lodash"

export default async function joinHub(req: Request, res: Response): Promise<void> {
	try {
		const { userId, classroomId } = req
		const { hubId } = req.body as { hubId: HubUUID }
		const { classCode } = req.params as { classCode: ClassCode }

		const username = await retrieveUsername(userId)
		const hub = HubManager.getInstance().addStudentToHub(hubId, userId, username || "")
		if (!hub) {
			res.status(400).json({ error: "Hub not found" } satisfies ErrorResponse)
			return
		}

		const teacherId = await getTeacherIdFromClassroom(classroomId)
		if (isUndefined(teacherId)) {
			res.status(400).json({ error: "Teacher not found" } satisfies ErrorResponse)
			return
		}
		const data: StudentJoinedHub = { classCode, hubId, studentUsername: username || "", studentUserId: userId }
		BrowserSocketManager.getInstance().emitStudentJoinedHub(teacherId, data)
		const studentViewHubData: StudentViewHubData = {
			hubId,
			classCode,
			careerUUID: hub.careerUUID,
			slideId: hub.slideId,
			hubName: hub.hubName
		}

		res.status(200).json(studentViewHubData satisfies StudentViewHubData)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to join classroom" } satisfies ErrorResponse)
		return
	}
}
