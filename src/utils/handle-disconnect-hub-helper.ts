import { StudentLeftHub } from "@lever-labs/common-ts/types/socket"
import HubManager from "../classes/hub-manager"
import BrowserSocketManager from "../classes/browser-socket-manager"

export default async function handleDisconnectHubHelper(userId: number): Promise<void> {
	try {
		const hubManager = await HubManager.getInstance()
		const studentHubs = await hubManager.getStudentHubsByUserId(userId)
		studentHubs.forEach(hub => {
			const data: StudentLeftHub = { classCode: hub.classCode, hubId: hub.hubId, studentUserId: userId }
			BrowserSocketManager.getInstance().emitStudentLeftHub(hub.teacherId, data)
		})
		await hubManager.removeStudentFromAllHubs(userId)
	} catch (error) {
		console.error(error)
	}
}
