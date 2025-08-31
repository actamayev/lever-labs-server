import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ClientSocketEvents, ClientSocketEventPayloadMap } from "@bluedotrobots/common-ts"

type ListenerHandler<T> = (payload: T) => Promise<void>

export const listenersMap: {
	[K in ClientSocketEvents]: ListenerHandler<ClientSocketEventPayloadMap[K]>
} = {
	"motor-control": async (motorControlData) =>
		await SendEsp32MessageManager.getInstance().transferMotorControlData(motorControlData),
	"new-led-colors": async (ledControlData) =>
		await SendEsp32MessageManager.getInstance().transferLedControlData(ledControlData),
	"headlight-update": async (headlightControlData) =>
		await SendEsp32MessageManager.getInstance().transferHeadlightControlData(headlightControlData),
	"horn-sound-update": async (hornControlData) =>
		await SendEsp32MessageManager.getInstance().transferHornSoundData(hornControlData),
	"play-fun-sound": async (funSoundsData) =>
		await SendEsp32MessageManager.getInstance().transferFunSoundsData(funSoundsData),
}
