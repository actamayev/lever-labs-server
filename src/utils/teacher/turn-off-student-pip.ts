import BrowserSocketManager from "../../classes/browser-socket-manager"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"

export function turnOffStudentPipLeds(studentUserId: number): void {
	try {
		const currentlyConnectedPip = BrowserSocketManager.getInstance().getCurrentlyConnectedPip(studentUserId)
		if (!currentlyConnectedPip) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPip.pipUUID, MessageBuilder.createLedMessage({
				topLeftColor: { r: 0, g: 0, b: 0 },
				topRightColor: { r: 0, g: 0, b: 0 },
				middleLeftColor: { r: 0, g: 0, b: 0 },
				middleRightColor: { r: 0, g: 0, b: 0 },
				backLeftColor: { r: 0, g: 0, b: 0 },
				backRightColor: { r: 0, g: 0, b: 0 }
			})
		)
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPip.pipUUID, MessageBuilder.createHeadlightMessage(false)
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export function brakeStudentPip(studentUserId: number): void {
	try {
		const currentlyConnectedPip = BrowserSocketManager.getInstance().getCurrentlyConnectedPip(studentUserId)
		if (!currentlyConnectedPip) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPip.pipUUID, MessageBuilder.createMotorControlMessage(0, 0)
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export function stopStudentPipSound(studentUserId: number): void {
	try {
		const currentlyConnectedPip = BrowserSocketManager.getInstance().getCurrentlyConnectedPip(studentUserId)
		if (!currentlyConnectedPip) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPip.pipUUID, MessageBuilder.createStopSoundMessage()
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export function resetStudentPipDisplay(studentUserId: number): void {
	try {
		const currentlyConnectedPip = BrowserSocketManager.getInstance().getCurrentlyConnectedPip(studentUserId)
		if (!currentlyConnectedPip) return

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			currentlyConnectedPip.pipUUID, MessageBuilder.createShowDisplayStartScreenMessage()
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

