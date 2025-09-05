import { DeletedHub, StudentLeftHub } from "@bluedotrobots/common-ts"
import HubManager from "../classes/hub-manager"
import BrowserSocketManager from "../classes/browser-socket-manager"

export default function handleDisconnectHubHelper(userId: number): void {
	try {
		const studentHubs = HubManager.getInstance().getStudentHubsByUserId(userId)
		studentHubs.forEach(hub => {
			const data: StudentLeftHub = { classCode: hub.classCode, hubId: hub.hubId, studentUserId: userId }
			BrowserSocketManager.getInstance().emitStudentLeftHub(hub.teacherId, data)
		})
		HubManager.getInstance().removeStudentFromAllHubs(userId)

		// Teacher
		const teacherHubs = HubManager.getInstance().getTeacherHubsByUserId(userId)
		teacherHubs.forEach(hub => {
			const data: DeletedHub = { classCode: hub.classCode, hubId: hub.hubId }
			BrowserSocketManager.getInstance().emitDeletedHubToStudents(hub.studentUserIds, data)
			HubManager.getInstance().deleteHub(hub.hubId)
		})
	} catch (error) {
		console.error(error)
	}
}
