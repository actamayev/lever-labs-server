import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import calculateMotorSpeeds from "../calculate-motor-speeds"
import { ClientSocketEvents, ClientSocketEventPayloadMap, PlayTonePayload } from "@lever-labs/common-ts/types/socket"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import { LedControlData, MotorControlData, HeadlightData } from "@lever-labs/common-ts/types/garage"
import { PipUUIDInterface } from "@lever-labs/common-ts/types/utils"

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
	"stop-tone": (pipUUIDInterface: PipUUIDInterface) => {
		try {
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				pipUUIDInterface.pipUUID,
				MessageBuilder.createStopToneCommandMessage()
			)
		} catch (error) {
			console.error(error)
		}
	},
	"play-tone": (playToneData: PlayTonePayload) => {
		try {
			void SendEsp32MessageManager.getInstance().sendBinaryMessage(
				playToneData.pipUUID,
				MessageBuilder.createToneCommandMessage(playToneData.toneType))
		} catch (error) {
			console.error(error)
		}
	},
}

export default listenersMap
