import Singleton from "../singleton"

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
		data: IncomingMotorControlData
	): Promise<void> {
		try {
			const speeds = this.calculateMotorSpeeds(data)

			// Create a 5-byte binary message:
			// Byte 1: Message type (1 = motor control)
			// Bytes 2-3: Left motor speed (signed 16-bit: -255 to 255)
			// Bytes 4-5: Right motor speed (signed 16-bit: -255 to 255)
			const buffer = new ArrayBuffer(5)
			const view = new DataView(buffer)

			view.setUint8(0, 1) // Message type: motor control
			view.setInt16(1, speeds.leftMotor, true) // Left motor speed (little-endian)
			view.setInt16(3, speeds.rightMotor, true) // Right motor speed (little-endian)

			console.log(`Sending motor binary - Left: ${speeds.leftMotor}, Right: ${speeds.rightMotor}`)

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
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	private calculateMotorSpeeds(data: IncomingMotorControlData): MotorSpeeds {
		console.log("data", data)
		const speeds = { leftMotor: 0, rightMotor: 0 }
		const { vertical, horizontal } = data.motorControl

		// Base speeds
		const maxSpeed = 255
		const forward = vertical ? vertical * maxSpeed : 0 // 1 = 255, -1 = -255, undefined = 0
		const turn = horizontal ? horizontal * maxSpeed : 0 // 1 = 255, -1 = -255, undefined = 0

		// Mix forward and turn
		if (turn === 0) {
			speeds.leftMotor = forward
			speeds.rightMotor = forward
		} else if (forward === 0) {
			speeds.leftMotor = -turn  // Left: -255 (back) for turn -255 (left), 255 (forward) for turn 255 (right)
			speeds.rightMotor = turn  // Right: 255 (forward) for turn -255 (left), -255 (back) for turn 255 (right)
		} else {
			// Diagonal movement: adjust speeds for turning while moving forward/backward
			speeds.leftMotor = Math.max(-255, Math.min(255, forward - turn / 2))
			speeds.rightMotor = Math.max(-255, Math.min(255, forward + turn / 2))
		}

		return speeds
	}
}
