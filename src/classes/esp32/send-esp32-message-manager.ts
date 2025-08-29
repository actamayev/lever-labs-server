import { isNull, isUndefined } from "lodash"
import Singleton from "../singleton"
import Esp32SocketManager from "./esp32-socket-manager"
import EspLatestFirmwareManager from "./esp-latest-firmware-manager"
import calculateMotorSpeeds from "../../utils/calculate-motor-speeds"
import { BalancePidsProps, LedControlData, LightAnimation,
	tuneToSoundType,lightToLEDType,
	MessageBuilder, MotorControlData, PipUUID, TuneToPlay,
	HeadlightData,
	PipUUIDPayload,
	PlayFunSoundPayload,
	HornData,
	CareerType,
	ValidTriggerMessageType,
} from "@bluedotrobots/common-ts"

export default class SendEsp32MessageManager extends Singleton {
	private constructor() {
		super()
	}

	public static override getInstance(): SendEsp32MessageManager {
		if (!SendEsp32MessageManager.instance) {
			SendEsp32MessageManager.instance = new SendEsp32MessageManager()
		}
		return SendEsp32MessageManager.instance
	}

	private getPipConnectionSocket(pipUUID: PipUUID): ExtendedWebSocket {
		try {
			const connection = Esp32SocketManager.getInstance().getConnection(pipUUID)
			if (!connection) {
				throw new Error(`No active connection for Pip ${pipUUID}`)
			}

			return connection.socket
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public transferUpdateAvailableMessage(pipUUIDPayload: PipUUIDPayload): Promise<void> {
		try {
			if (isUndefined(process.env.NODE_ENV)) return Promise.resolve()
			const latestFirmwareVersion = EspLatestFirmwareManager.getInstance().latestFirmwareVersion
			if (pipUUIDPayload.firmwareVersion >= latestFirmwareVersion) return Promise.resolve()

			const buffer = MessageBuilder.createUpdateAvailableMessage(latestFirmwareVersion)

			return this.sendBinaryMessage(pipUUIDPayload.pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferMotorControlData(motorControlData: MotorControlData): Promise<void> {
		try {
			const speeds = calculateMotorSpeeds(motorControlData)
			const buffer = MessageBuilder.createMotorControlMessage(
				speeds.leftMotor,
				speeds.rightMotor
			)

			return this.sendBinaryMessage(motorControlData.pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferLedControlData(data: LedControlData): Promise<void> {
		try {
			const buffer = MessageBuilder.createLedMessage(data)

			return this.sendBinaryMessage(data.pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferLedControlDataToAll(data: Omit<LedControlData, "pipUUID">): Promise<void[]> {
		try {
			const buffer = MessageBuilder.createLedMessage(data as LedControlData)
			const connectedPipUUIDs = Esp32SocketManager.getInstance().getAllConnectedPipUUIDs()
			const promises: Promise<void>[] = []

			// Send to all connected ESP32 devices
			for (const pipUUID of connectedPipUUIDs) {
				promises.push(this.sendBinaryMessage(pipUUID, buffer))
			}

			return Promise.all(promises)
		} catch (error: unknown) {
			console.error("Transfer to all failed:", error)
			throw new Error(`Transfer to all failed: ${error || "Unknown reason"}`)
		}
	}

	public transferHeadlightControlData(data: HeadlightData): Promise<void> {
		try {
			const buffer = MessageBuilder.createHeadlightMessage(data.areHeadlightsOn)

			return this.sendBinaryMessage(data.pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferHornSoundData(data: HornData): Promise<void> {
		try {
			const buffer = MessageBuilder.createHornSoundMessage(data.hornStatus)

			return this.sendBinaryMessage(data.pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferFunSoundsData(funSoundsData: PlayFunSoundPayload): Promise<void> {
		try {
			if (funSoundsData.sound === null) {
				const buffer = MessageBuilder.createStopSoundMessage()
				return this.sendBinaryMessage(funSoundsData.pipUUID, buffer)
			}
			const soundType = tuneToSoundType[funSoundsData.sound]
			const buffer = MessageBuilder.createSoundMessage(soundType)
			return this.sendBinaryMessage(funSoundsData.pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public playSoundToAll(): Promise<void[]> {
		const tuneToPlay = "Chime"
		try {
			const soundType = tuneToSoundType[tuneToPlay]
			const buffer = MessageBuilder.createSoundMessage(soundType)
			const connectedPipUUIDs = Esp32SocketManager.getInstance().getAllConnectedPipUUIDs()
			const promises: Promise<void>[] = []

			for (const pipUUID of connectedPipUUIDs) {
				promises.push(this.sendBinaryMessage(pipUUID, buffer))
			}

			return Promise.all(promises)
		} catch (error: unknown) {
			console.error("Sound transfer to all failed:", error)
			throw new Error(`Sound transfer to all failed: ${error || "Unknown reason"}`)
		}
	}

	public playSound(pipUUID: PipUUID, tuneToPlay: TuneToPlay): Promise<void> {
		try {
			const soundType = tuneToSoundType[tuneToPlay]
			const buffer = MessageBuilder.createSoundMessage(soundType)

			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Sound transfer failed:", error)
			throw new Error(`Sound transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public displayLights(pipUUID: PipUUID, lightAnimation: LightAnimation): Promise<void> {
		try {
			const lightType = lightToLEDType[lightAnimation]
			const buffer = MessageBuilder.createLightAnimationMessage(lightType)

			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Light transfer failed:", error)
			throw new Error(`Light transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public updateDisplay(pipUUID: PipUUID, buffer: Uint8Array): Promise<void> {
		try {
			const displayBufferMessage = MessageBuilder.createDisplayBufferMessage(buffer)
			if (isNull(displayBufferMessage)) {
				throw new Error("Display buffer message is null")
			}
			return this.sendBinaryMessage(pipUUID, displayBufferMessage)
		} catch (error: unknown) {
			console.error("Display update failed:", error)
			throw new Error(`Display update failed: ${error || "Unknown reason"}`)
		}
	}

	public changeAudibleStatus(pipUUID: PipUUID, audibleStatus: boolean): Promise<void> {
		try {
			const buffer = MessageBuilder.createSpeakerMuteMessage(audibleStatus)

			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Mute command failed:", error)
			throw new Error(`Mute command failed: ${error || "Unknown reason"}`)
		}
	}

	public changeVolume(pipUUID: PipUUID, volume: number): Promise<void> {
		try {
			const buffer = MessageBuilder.createSpeakerVolumeMessage(volume)

			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Volume command failed:", error)
			throw new Error(`Volume command failed: ${error || "Unknown reason"}`)
		}
	}

	public changeBalanceStatus(pipUUID: PipUUID, balanceStatus: boolean): Promise<void> {
		try {
			const buffer = MessageBuilder.createBalanceMessage(balanceStatus)

			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Balance command failed:", error)
			throw new Error(`Balance command failed: ${error || "Unknown reason"}`)
		}
	}

	public changeBalancePids(data: BalancePidsProps): Promise<void> {
		try {
			const buffer = MessageBuilder.createUpdateBalancePidsMessage(data)

			return this.sendBinaryMessage(data.pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Balance command failed:", error)
			throw new Error(`Balance command failed: ${error || "Unknown reason"}`)
		}
	}

	public sendBytecodeToPip(pipUUID: PipUUID, bytecodeFloat32: Float32Array): Promise<void> {
		try {
			const buffer = MessageBuilder.createBytecodeMessage(bytecodeFloat32)
			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Bytecode upload failed:", error)
			throw new Error(`Bytecode upload failed: ${error || "Unknown reason"}`)
		}
	}

	public stopCurrentlyRunningSandboxCode(pipUUID: PipUUID): Promise<void> {
		try {
			const buffer = MessageBuilder.createStopSandboxCodeMessage()
			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Stop command failed:", error)
			throw new Error(`Stop command failed: ${error || "Unknown reason"}`)
		}
	}

	public stopSensorPolling(pipUUID: PipUUID): Promise<void> {
		try {
			const buffer = MessageBuilder.createStopSensorPollingMessage()
			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Stop command failed:", error)
			throw new Error(`Stop command failed: ${error || "Unknown reason"}`)
		}
	}

	public pollSensors(pipUUID: PipUUID): Promise<void> {
		try {
			const buffer = MessageBuilder.createStartSensorPollingMessage()
			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Stop command failed:", error)
			throw new Error(`Stop command failed: ${error || "Unknown reason"}`)
		}
	}

	public requestBatteryMonitorData(pipUUID: PipUUID): Promise<void> {
		try {
			const buffer = MessageBuilder.createRequestBatteryMonitorDataMessage()
			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Battery monitor data request failed:", error)
			throw new Error(`Battery monitor data request failed: ${error || "Unknown reason"}`)
		}
	}

	public triggerCareerQuestMessage<T extends CareerType>(
		careerType: T,
		triggerMessageType: ValidTriggerMessageType<T>,
		pipUUID: PipUUID
	): Promise<void> {
		try {
			const buffer = MessageBuilder.createTriggerMessage(careerType, triggerMessageType)
			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Career quest message failed:", error)
			throw new Error(`Career quest message failed: ${error || "Unknown reason"}`)
		}
	}

	private sendBinaryMessage(pipUUID: PipUUID, buffer: ArrayBuffer): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(pipUUID)

			return new Promise((resolve, reject) => {
				socket.send(buffer, { binary: true }, (error) => {
					if (error) {
						reject(new Error(`Failed to send data: ${error.message}`))
					} else {
						resolve()
					}
				})
			})
		} catch (error: unknown) {
			console.error(`Failed to send binary message to Pip ${pipUUID}:`, error)
			throw error
		}
	}
}
