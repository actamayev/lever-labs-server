declare global {
	type MotorDirection = "up" | "down" | "left" | "right"

	interface IncomingMotorControlData {
		motorControl: {
			vertical: -1 | 1 | 0
			horizontal: -1 | 1 | 0
		}
		pipUUID: PipUUID
	}

	interface MotorSpeeds {
		leftMotor: number
		rightMotor: number
	}

	type TuneToPlay = "Alert" | "Beep" | "Chime"

	type LightStatus = "Breathing" | "Turn off" | "Fade out" | "Pause breathing"

	interface BalancePidsProps {
		pipUUID: PipUUID
		targetAngle: number
		pValue: number
		iValue: number
		dValue: number
		ffValue: number
		maxSafeAngleDeviation: number
		updateInterval: number
		deadbandAngle: number
		maxStableRotation: number
		minEffectivePwm: number
	}
}

export {}
