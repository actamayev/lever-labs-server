import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import calculateMotorSpeeds from "../calculate-motor-speeds"
import { ClientSocketEvents, ClientSocketEventPayloadMap } from "@bluedotrobots/common-ts/types/socket"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import { tuneToSoundType } from "@bluedotrobots/common-ts/protocol"
import { LedControlData, MotorControlData, HeadlightData, HornData } from "@bluedotrobots/common-ts/types/garage"
import { PlayFunSoundPayload } from "@bluedotrobots/common-ts/types/pip"

type ListenerHandler<T> = (payload: T) => void

const listenersMap: {
	[K in ClientSocketEvents]: ListenerHandler<ClientSocketEventPayloadMap[K]>
} = {
	"motor-control": (motorControlData: MotorControlData) => {
		try {
			const speeds = calculateMotorSpeeds(motorControlData)
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				motorControlData.pipUUID,
				MessageBuilder.createMotorControlMessage(
					speeds.leftMotor,
					speeds.rightMotor
				))
		} catch (error) {
			console.error(error)
		}
	},
	"new-led-colors": (ledControlData: LedControlData) => {
		try {
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				ledControlData.pipUUID,
				MessageBuilder.createLedMessage(ledControlData))
		} catch (error) {
			console.error(error)
		}
	},
	"headlight-update": (headlightControlData: HeadlightData) => {
		try {
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				headlightControlData.pipUUID,
				MessageBuilder.createHeadlightMessage(headlightControlData.areHeadlightsOn))
		} catch (error) {
			console.error(error)
		}
	},
	"horn-sound-update": (hornControlData: HornData) => {
		try {
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				hornControlData.pipUUID,
				MessageBuilder.createHornSoundMessage(hornControlData.hornStatus))
		} catch (error) {
			console.error(error)
		}
	},
	"play-fun-sound": (funSoundsData: PlayFunSoundPayload) => {
		try {
			if (funSoundsData.sound === null) {
				const buffer = MessageBuilder.createStopSoundMessage()
				return void SendEsp32MessageManager.getInstance().sendBinaryMessage(funSoundsData.pipUUID, buffer)
			}
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				funSoundsData.pipUUID,
				MessageBuilder.createSoundMessage(tuneToSoundType[funSoundsData.sound]))
		} catch (error) {
			console.error(error)
		}
	},
}

export default listenersMap
