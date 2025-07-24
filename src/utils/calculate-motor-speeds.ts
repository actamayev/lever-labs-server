import { clamp } from "lodash"
import { MotorControlData } from "@bluedotrobots/common-ts"

interface MotorSpeeds {
	leftMotor: number
	rightMotor: number
}

// eslint-disable-next-line max-lines-per-function, complexity
export default function calculateMotorSpeeds(data: Omit<MotorControlData, "pipUUID">): MotorSpeeds {
	const speeds = { leftMotor: 0, rightMotor: 0 }
	const { vertical, horizontal } = data.motorControl
	const { motorThrottlePercent } = data

	const maxSpeed = 230
	const spinSpeed = 100
	const turnSpeed = 50

	// Define min/max speeds for different directions (this is used when throttling)
	const forwardMinSpeed = 52
	const backwardMaxSpeed = -56
	const backwardMinSpeed = -230
	const sideMaxSpeed = 100
	const sideMinSpeed = -100

	// Helper function to apply throttle with specific bounds
	const applyThrottle = (baseSpeed: number, min: number, max: number): number => {
		// Apply throttle percentage
		const throttledSpeed = baseSpeed * motorThrottlePercent / 100
		// Clamp to specified bounds
		return clamp(throttledSpeed, min, max)
	}

	// Define speeds based on vertical and horizontal inputs
	if (vertical === 0 && horizontal === 0) {
		// Stop
		speeds.leftMotor = 0
		speeds.rightMotor = 0
		return speeds
	} else if (vertical === 1 && horizontal === 0) {
		// Forward - minimum speed 52, maximum 230
		const throttledSpeed = applyThrottle(maxSpeed, forwardMinSpeed, maxSpeed)
		speeds.leftMotor = throttledSpeed
		speeds.rightMotor = throttledSpeed
	} else if (vertical === -1 && horizontal === 0) {
		// Backward - maximum speed -56, minimum -230
		const throttledSpeed = applyThrottle(-maxSpeed, backwardMinSpeed, backwardMaxSpeed)
		speeds.leftMotor = throttledSpeed
		speeds.rightMotor = throttledSpeed
	} else if (vertical === 0 && horizontal === -1) {
		// Left turn - capped at -71/71
		speeds.leftMotor = applyThrottle(-spinSpeed, sideMinSpeed, sideMaxSpeed)
		speeds.rightMotor = applyThrottle(spinSpeed, sideMinSpeed, sideMaxSpeed)
	} else if (vertical === 0 && horizontal === 1) {
		// Right turn - capped at -71/71
		speeds.leftMotor = applyThrottle(spinSpeed, sideMinSpeed, sideMaxSpeed)
		speeds.rightMotor = applyThrottle(-spinSpeed, sideMinSpeed, sideMaxSpeed)
	} else if (vertical === 1 && horizontal === -1) {
		// Forward + Left
		speeds.leftMotor = applyThrottle(turnSpeed, forwardMinSpeed / 2, maxSpeed / 2)
		speeds.rightMotor = applyThrottle(maxSpeed, forwardMinSpeed, maxSpeed)
	} else if (vertical === 1 && horizontal === 1) {
		// Forward + Right
		speeds.leftMotor = applyThrottle(maxSpeed, forwardMinSpeed, maxSpeed)
		speeds.rightMotor = applyThrottle(turnSpeed, forwardMinSpeed / 2, maxSpeed / 2)
	} else if (vertical === -1 && horizontal === -1) {
		// Backward + Left
		speeds.leftMotor = applyThrottle(-maxSpeed, backwardMinSpeed, backwardMaxSpeed)
		speeds.rightMotor = applyThrottle(-turnSpeed, backwardMaxSpeed, backwardMinSpeed)
	} else if (vertical === -1 && horizontal === 1) {
		// Backward + Right
		speeds.leftMotor = applyThrottle(-turnSpeed, backwardMaxSpeed, backwardMinSpeed)
		speeds.rightMotor = applyThrottle(-maxSpeed, backwardMinSpeed, backwardMaxSpeed)
	}

	return speeds
}
