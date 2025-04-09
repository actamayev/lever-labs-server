declare global {
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
