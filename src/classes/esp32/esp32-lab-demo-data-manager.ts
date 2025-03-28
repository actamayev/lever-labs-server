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

	// eslint-disable-next-line complexity
	private calculateMotorSpeeds(data: IncomingMotorControlData): MotorSpeeds {
		const speeds = { leftMotor: 0, rightMotor: 0 }
		const { vertical, horizontal } = data.motorControl

		const maxSpeed = 255
		const spinSpeed = 100
		const turnSpeed = 30 // Slower wheel speed for diagonal turns (adjust as needed)

		// Define speeds based on vertical and horizontal inputs
		if (vertical === 0 && horizontal === 0) {
			// Stop
			speeds.leftMotor = 0
			speeds.rightMotor = 0
		} else if (vertical === 1 && horizontal === 0) {
			// Forward
			speeds.leftMotor = maxSpeed
			speeds.rightMotor = maxSpeed
		} else if (vertical === -1 && horizontal === 0) {
			// Backward
			speeds.leftMotor = -maxSpeed
			speeds.rightMotor = -maxSpeed
		} else if (vertical === 0 && horizontal === -1) {
			// Left turn
			speeds.leftMotor = -spinSpeed
			speeds.rightMotor = spinSpeed
		} else if (vertical === 0 && horizontal === 1) {
			// Right turn
			speeds.leftMotor = spinSpeed
			speeds.rightMotor = -spinSpeed
		} else if (vertical === 1 && horizontal === -1) {
			// Forward + Left
			speeds.leftMotor = turnSpeed
			speeds.rightMotor = maxSpeed
		} else if (vertical === 1 && horizontal === 1) {
			// Forward + Right
			speeds.leftMotor = maxSpeed
			speeds.rightMotor = turnSpeed
		} else if (vertical === -1 && horizontal === -1) {
			// Backward + Left
			speeds.leftMotor = -maxSpeed
			speeds.rightMotor = -turnSpeed
		} else if (vertical === -1 && horizontal === 1) {
			// Backward + Right
			speeds.leftMotor = -turnSpeed
			speeds.rightMotor = -maxSpeed
		}

		return speeds
	}

	public playSound(
		socket: ExtendedWebSocket,
		tune: TuneToPlay
	): Promise<void> {
		try {
			const buffer = new ArrayBuffer(2)
			const view = new DataView(buffer)

			// Set message type to 2 (sound command)
			view.setUint8(0, 2)

			// Set tune type:
			// 0 = Alert
			// 1 = Beep
			// 2 = Chime
			let tuneId = 0
			if (tune === "Beep") tuneId = 1
			else if (tune === "Chime") tuneId = 2

			view.setUint8(1, tuneId)

			return new Promise((resolve, reject) => {
				socket.send(buffer, { binary: true }, (error) => {
					if (error) {
						reject(new Error(`Failed to send sound data: ${error.message}`))
					} else {
						resolve()
					}
				})
			})
		} catch (error: unknown) {
			console.error("Sound transfer failed:", error)
			throw new Error(`Sound transfer failed: ${error || "Unknown reason"}`)
		}
	}
}
