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
		data: MotorControlData
	): Promise<void> {
		try {
			// Create a 2-byte binary message:
			// Byte 1: Message type (1 = motor control)
			// Byte 2: Contains both motor values:
			//   - Left motor in first 4 bits
			//   - Right motor in last 4 bits
			const buffer = new ArrayBuffer(2)
			const view = new Uint8Array(buffer)

			view[0] = 1  // Message type: motor control

			const leftValue = this.motorSpeedToByte(data.leftMotor)
			const rightValue = this.motorSpeedToByte(data.rightMotor)
			view[1] = (leftValue << 4) | rightValue

			console.log(`Sending motor binary - Left: ${data.leftMotor}, Right: ${data.rightMotor}`)

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

	private motorSpeedToByte(speed: number): number {
		switch (speed) {
		case -1: return 0  // Backward
		case 0:  return 1  // Stop
		case 1:  return 2  // Forward
		default: return 1  // Default to stop
		}
	}
}
