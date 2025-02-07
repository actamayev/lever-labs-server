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
			const metadata: MotorControlTransferData = {
				event: "motor-control-data",
				leftMotor: data.leftMotor,
				rightMotor: data.rightMotor
			}

			console.log("metadata", metadata)

			return new Promise((resolve, reject) => {
				socket.send(JSON.stringify(metadata), (error) => {
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
}
