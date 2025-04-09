import Singleton from "../singleton"
import { MessageBuilder } from "./message-builder"
import { lightToLEDType, tuneToSoundType } from "../../utils/protocol"
import { clamp } from "lodash"

export default class ESP32LabDemoDataManager extends Singleton {
	private constructor() {
		super()
	}

	public static getInstance(): ESP32LabDemoDataManager {
		if (!ESP32LabDemoDataManager.instance) {
			ESP32LabDemoDataManager.instance = new ESP32LabDemoDataManager()
		}
		return ESP32LabDemoDataManager.instance
	}

	public transferMotorControlData(
		socket: ExtendedWebSocket,
		data: Omit<IncomingMotorControlData, "pipUUID">
	): Promise<void> {
		try {
			const speeds = this.calculateMotorSpeeds(data)
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

	// eslint-disable-next-line complexity, max-lines-per-function
	private calculateMotorSpeeds(data: Omit<IncomingMotorControlData, "pipUUID">): MotorSpeeds {
		const speeds = { leftMotor: 0, rightMotor: 0 }
		const { vertical, horizontal } = data.motorControl
		const { motorThrottlePercent } = data

		const maxSpeed = 255
		const spinSpeed = 100
		const turnSpeed = 50

		// Define min/max speeds for different directions
		const forwardMinSpeed = 52
		const backwardMaxSpeed = -56
		const backwardMinSpeed = -255
		const sideMaxSpeed = 100
		const sideMinSpeed = -100

		// Helper function to apply throttle with specific bounds
		const applyThrottle = (baseSpeed: number, min: number, max: number): number => {
		// Apply throttle percentage
			const throttledSpeed = baseSpeed * motorThrottlePercent / 100
			// Clamp to specified bounds
			return clamp(throttledSpeed, min, max)
		}

		// Define speeds based on vertical and horizontal inputs
		if (vertical === 0 && horizontal === 0) {
		// Stop
			speeds.leftMotor = 0
			speeds.rightMotor = 0
			return speeds
		} else if (vertical === 1 && horizontal === 0) {
		// Forward - minimum speed 52, maximum 255
			const throttledSpeed = applyThrottle(maxSpeed, forwardMinSpeed, maxSpeed)
			speeds.leftMotor = throttledSpeed
			speeds.rightMotor = throttledSpeed
		} else if (vertical === -1 && horizontal === 0) {
		// Backward - maximum speed -56, minimum -255
			const throttledSpeed = applyThrottle(-maxSpeed, backwardMinSpeed, backwardMaxSpeed)
			speeds.leftMotor = throttledSpeed
			speeds.rightMotor = throttledSpeed
		} else if (vertical === 0 && horizontal === -1) {
		// Left turn - capped at -71/71
			speeds.leftMotor = applyThrottle(-spinSpeed, sideMinSpeed, sideMaxSpeed)
			speeds.rightMotor = applyThrottle(spinSpeed, sideMinSpeed, sideMaxSpeed)
		} else if (vertical === 0 && horizontal === 1) {
		// Right turn - capped at -71/71
			speeds.leftMotor = applyThrottle(spinSpeed, sideMinSpeed, sideMaxSpeed)
			speeds.rightMotor = applyThrottle(-spinSpeed, sideMinSpeed, sideMaxSpeed)
		} else if (vertical === 1 && horizontal === -1) {
		// Forward + Left
			speeds.leftMotor = applyThrottle(turnSpeed, forwardMinSpeed / 2, maxSpeed / 2)
			speeds.rightMotor = applyThrottle(maxSpeed, forwardMinSpeed, maxSpeed)
		} else if (vertical === 1 && horizontal === 1) {
		// Forward + Right
			speeds.leftMotor = applyThrottle(maxSpeed, forwardMinSpeed, maxSpeed)
			speeds.rightMotor = applyThrottle(turnSpeed, forwardMinSpeed / 2, maxSpeed / 2)
		} else if (vertical === -1 && horizontal === -1) {
		// Backward + Left
			speeds.leftMotor = applyThrottle(-maxSpeed, backwardMinSpeed, backwardMaxSpeed)
			speeds.rightMotor = applyThrottle(-turnSpeed, backwardMaxSpeed / 2, backwardMinSpeed / 2)
		} else if (vertical === -1 && horizontal === 1) {
		// Backward + Right
			speeds.leftMotor = applyThrottle(-turnSpeed, backwardMaxSpeed / 2, backwardMinSpeed / 2)
			speeds.rightMotor = applyThrottle(-maxSpeed, backwardMinSpeed, backwardMaxSpeed)
		}

		return speeds
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
