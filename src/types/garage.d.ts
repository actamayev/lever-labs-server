import { PipUUID } from "@bluedotrobots/common-ts"

declare global {
	interface MotorSpeeds {
		leftMotor: number
		rightMotor: number
	}

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
