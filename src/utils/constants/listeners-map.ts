import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ClientSocketEvents, ClientSocketEventPayloadMap, MessageBuilder, tuneToSoundType } from "@bluedotrobots/common-ts"
import calculateMotorSpeeds from "../calculate-motor-speeds"

type ListenerHandler<T> = (payload: T) => void

const listenersMap: {
	[K in ClientSocketEvents]: ListenerHandler<ClientSocketEventPayloadMap[K]>
} = {
	"motor-control": (motorControlData) => {
		const speeds = calculateMotorSpeeds(motorControlData)
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			motorControlData.pipUUID,
			MessageBuilder.createMotorControlMessage(
				speeds.leftMotor,
				speeds.rightMotor
			))
	},
	"new-led-colors": (ledControlData) =>
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			ledControlData.pipUUID,
			MessageBuilder.createLedMessage(ledControlData))
	,
	"headlight-update": (headlightControlData) => {
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			headlightControlData.pipUUID,
			MessageBuilder.createHeadlightMessage(headlightControlData.areHeadlightsOn))
	},
	"horn-sound-update": (hornControlData) =>
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			hornControlData.pipUUID,
			MessageBuilder.createHornSoundMessage(hornControlData.hornStatus))
	,
	"play-fun-sound": (funSoundsData) => {
		if (funSoundsData.sound === null) {
			const buffer = MessageBuilder.createStopSoundMessage()
			return void SendEsp32MessageManager.getInstance().sendBinaryMessage(funSoundsData.pipUUID, buffer)
		}
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			funSoundsData.pipUUID,
			MessageBuilder.createSoundMessage(tuneToSoundType[funSoundsData.sound]))
	},
}

export default listenersMap
