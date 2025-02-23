declare global {
	type MotorDirection = "up" | "down" | "left" | "right"

	interface IncomingMotorControlData {
		motorControl: { vertical?: -1 | 1; horizontal?: -1 | 1 }
		pipUUID: PipUUID
	}

	interface MotorSpeeds {
		leftMotor: number
		rightMotor: number
	}

}

export {}
