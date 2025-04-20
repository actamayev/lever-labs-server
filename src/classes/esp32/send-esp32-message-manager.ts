import Singleton from "../singleton"
import { MessageBuilder } from "./message-builder"
import { lightToLEDType, tuneToSoundType } from "../../utils/protocol"
import calculateMotorSpeeds from "../../utils/calculate-motor-speeds"

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

	public transferUpdateAvailableMessage(
		socket: ExtendedWebSocket,
		newFirmwareVersion: number
	): Promise<void> {
		try {
			const buffer = MessageBuilder.createUpdateAvailableMessage(newFirmwareVersion)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferMotorControlData(
		socket: ExtendedWebSocket,
		data: Omit<IncomingMotorControlData, "pipUUID">
	): Promise<void> {
		try {
			const speeds = calculateMotorSpeeds(data)
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

	public transferLedControlData(
		socket: ExtendedWebSocket,
		data: Omit<IncomingNewLedControlData, "pipUUID">
	): Promise<void> {
		try {
			const buffer = MessageBuilder.createLedMessage(data)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public playSound(
		socket: ExtendedWebSocket,
		tune: TuneToPlay
	): Promise<void> {
		try {
			const soundType = tuneToSoundType[tune]
			const buffer = MessageBuilder.createSoundMessage(soundType)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Sound transfer failed:", error)
			throw new Error(`Sound transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public displayLights(
		socket: ExtendedWebSocket,
		lightAnimation: LightAnimation
	): Promise<void> {
		try {
			const lightType = lightToLEDType[lightAnimation]
			const buffer = MessageBuilder.createLightAnimationMessage(lightType)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Light transfer failed:", error)
			throw new Error(`Light transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public changeAudibleStatus(
		socket: ExtendedWebSocket,
		audibleStatus: boolean
	): Promise<void> {
		try {
			const buffer = MessageBuilder.createSpeakerMuteMessage(audibleStatus)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Mute command failed:", error)
			throw new Error(`Mute command failed: ${error || "Unknown reason"}`)
		}
	}

	public changeBalanceStatus(
		socket: ExtendedWebSocket,
		balanceStatus: boolean
	): Promise<void> {
		try {
			const buffer = MessageBuilder.createBalanceMessage(balanceStatus)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Balance command failed:", error)
			throw new Error(`Balance command failed: ${error || "Unknown reason"}`)
		}
	}

	public changeBalancePids(
		socket: ExtendedWebSocket,
		balancePids: Omit<BalancePidsProps, "pipUUID">
	): Promise<void> {
		try {
			const buffer = MessageBuilder.createUpdateBalancePidsMessage(balancePids)

			return this.sendBinaryMessage(socket, buffer)
		} catch (error: unknown) {
			console.error("Balance command failed:", error)
			throw new Error(`Balance command failed: ${error || "Unknown reason"}`)
		}
	}

	public sendBytecodeToPip(
		socket: ExtendedWebSocket,
		bytecodeFloat32: Float32Array
	): Promise<void> {
		try {
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
