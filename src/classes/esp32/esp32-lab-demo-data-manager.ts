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

			const buffer = new ArrayBuffer(5)
			const view = new DataView(buffer)

			view.setUint8(0, 1)
			view.setInt16(1, speeds.leftMotor, true)
			view.setInt16(3, speeds.rightMotor, true)

			// console.log(`Sending motor binary - Left: ${speeds.leftMotor}, Right: ${speeds.rightMotor},
			// 	Buffer: [${Array.from(new Uint8Array(buffer)).join(", ")}]`)

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
		// console.log("Incoming data:", JSON.stringify(data))
		const speeds = { leftMotor: 0, rightMotor: 0 }
		const { vertical, horizontal } = data.motorControl

		const maxSpeed = 255
		const forward = vertical * maxSpeed // -255, 0, or 255
		const turn = horizontal * maxSpeed  // -255, 0, or 255

		if (turn === 0) {
			speeds.leftMotor = forward
			speeds.rightMotor = forward
		} else if (forward === 0) {
			speeds.leftMotor = turn       // Left follows turn direction
			speeds.rightMotor = -turn     // Right opposes turn direction
		} else {
			// Diagonal movement: amplify turn by reducing the slower wheel more
			const turnFactor = turn > 0 ? 1.5 : -1.5 // Right turn: positive, Left turn: negative
			speeds.leftMotor = Math.max(-255, Math.min(255, forward - turnFactor * turn / 2))
			speeds.rightMotor = Math.max(-255, Math.min(255, forward + turnFactor * turn / 2))
		}

		return speeds
	}
}
