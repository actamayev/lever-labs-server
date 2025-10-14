import getCurrentlyConnectedPipUUID from "../pip/get-currently-connected-pip-uuid"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"

export function brakeStudentPip(studentUserId: number): void {
	try {
		const currentlyConnectedPipUUID = getCurrentlyConnectedPipUUID(studentUserId)
		if (!currentlyConnectedPipUUID) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPipUUID, MessageBuilder.createMotorControlMessage(0, 0)
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export function stopStudentPipSound(studentUserId: number): void {
	try {
		const currentlyConnectedPipUUID = getCurrentlyConnectedPipUUID(studentUserId)
		if (!currentlyConnectedPipUUID) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPipUUID, MessageBuilder.createStopSoundMessage()
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export function resetStudentPipDisplay(studentUserId: number): void {
	try {
		const currentlyConnectedPipUUID = getCurrentlyConnectedPipUUID(studentUserId)
		if (!currentlyConnectedPipUUID) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPipUUID, MessageBuilder.createShowDisplayStartScreenMessage()
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

