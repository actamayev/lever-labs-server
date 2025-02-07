declare global {
	type MotorDirection = -1 | 0 | 1

	interface MotorControlData {
		leftMotor: MotorDirection
		rightMotor: MotorDirection
	}

	interface IncomingMotorControlData extends MotorControlData {
		pipUUID: PipUUID
	}
}

export {}
