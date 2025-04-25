declare global {
	interface RGB {
		r: number
		g: number
		b: number
	}

	interface IncomingMotorControlData {
		motorControl: {
			vertical: -1 | 1 | 0
			horizontal: -1 | 1 | 0
		}
		motorThrottlePercent: number
		pipUUID: PipUUID
	}

	interface IncomingNewLedControlData {
		topLeftColor: RGB
		topRightColor: RGB
		middleLeftColor: RGB
		middleRightColor: RGB
		backLeftColor: RGB
		backRightColor: RGB
		pipUUID: PipUUID
	}

	interface MotorSpeeds {
		leftMotor: number
		rightMotor: number
	}

	type LightAnimation =
		| "No animation"
		| "Breathing"
		| "Rainbow"
		| "Strobe"
		| "Turn off"
		| "Fade out"
		// | "Pause breathing"
		// | "Snake"

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
