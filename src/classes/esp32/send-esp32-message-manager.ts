import { isUndefined } from "lodash"
import Singleton from "../singleton"
import { MessageBuilder } from "./message-builder"
import Esp32SocketManager from "./esp32-socket-manager"
import EspLatestFirmwareManager from "./esp-latest-firmware-manager"
import calculateMotorSpeeds from "../../utils/calculate-motor-speeds"
import { lightToLEDType, tuneToSoundType } from "../../utils/protocol"

export default class SendEsp32MessageManager extends Singleton {
	private constructor() {
		super()
	}

	public static getInstance(): SendEsp32MessageManager {
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

			const socket = this.getPipConnectionSocket(pipUUIDPayload.pipUUID)
			const buffer = MessageBuilder.createUpdateAvailableMessage(pipUUIDPayload.firmwareVersion)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferMotorControlData(motorControlData: IncomingMotorControlData): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(motorControlData.pipUUID)
			const speeds = calculateMotorSpeeds(motorControlData)
			const buffer = MessageBuilder.createMotorControlMessage(
				speeds.leftMotor,
				speeds.rightMotor
			)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferLedControlData(data: IncomingNewLedControlData): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(data.pipUUID)
			const buffer = MessageBuilder.createLedMessage(data)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public playSound(
		pipUUID: PipUUID,
		tuneToPlay: TuneToPlay
	): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(pipUUID)
			const soundType = tuneToSoundType[tuneToPlay]
			const buffer = MessageBuilder.createSoundMessage(soundType)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Sound transfer failed:", error)
			throw new Error(`Sound transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public displayLights(
		pipUUID: PipUUID,
		lightAnimation: LightAnimation
	): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(pipUUID)
			const lightType = lightToLEDType[lightAnimation]
			const buffer = MessageBuilder.createLightAnimationMessage(lightType)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Light transfer failed:", error)
			throw new Error(`Light transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public changeAudibleStatus(
		pipUUID: PipUUID,
		audibleStatus: boolean
	): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(pipUUID)
			const buffer = MessageBuilder.createSpeakerMuteMessage(audibleStatus)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Mute command failed:", error)
			throw new Error(`Mute command failed: ${error || "Unknown reason"}`)
		}
	}

	public changeBalanceStatus(
		pipUUID: PipUUID,
		balanceStatus: boolean
	): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(pipUUID)
			const buffer = MessageBuilder.createBalanceMessage(balanceStatus)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Balance command failed:", error)
			throw new Error(`Balance command failed: ${error || "Unknown reason"}`)
		}
	}

	public changeBalancePids(data: BalancePidsProps): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(data.pipUUID)
			const buffer = MessageBuilder.createUpdateBalancePidsMessage(data)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Balance command failed:", error)
			throw new Error(`Balance command failed: ${error || "Unknown reason"}`)
		}
	}

	public sendBytecodeToPip(
		pipUUID: PipUUID,
		bytecodeFloat32: Float32Array
	): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(pipUUID)
			const buffer = MessageBuilder.createBytecodeMessage(bytecodeFloat32)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Bytecode upload failed:", error)
			throw new Error(`Bytecode upload failed: ${error || "Unknown reason"}`)
		}
	}

	private sendBinaryMessage(socket: ExtendedWebSocket, buffer: ArrayBuffer): Promise<void> {
		return new Promise((resolve, reject) => {
			socket.send(buffer, { binary: true }, (error) => {
				if (error) {
					reject(new Error(`Failed to send data: ${error.message}`))
				} else {
					resolve()
				}
			})
		})
	}
}
