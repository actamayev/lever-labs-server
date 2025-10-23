import { MotorControlData } from "@lever-labs/common-ts/types/garage"

interface MotorSpeeds {
	leftMotor: number
	rightMotor: number
}

type MovementType = "stop" | "straight" | "spin" | "turn"

interface SpeedConfig {
	minSpeed: number
	maxSpeed: number
}

// Speed configurations for different movement types
// eslint-disable-next-line @typescript-eslint/naming-convention
const SPEED_CONFIGS: Record<MovementType, SpeedConfig> = {
	stop: { minSpeed: 0, maxSpeed: 0 },
	straight: { minSpeed: 650, maxSpeed: 4095 },
	spin: { minSpeed: 650, maxSpeed: 1600 },
	turn: { minSpeed: 650, maxSpeed: 2000 }
}

/**
 * Classifies the movement type based on vertical and horizontal inputs
 */
function classifyMovement(vertical: number, horizontal: number): MovementType {
	if (vertical === 0 && horizontal === 0) {
		return "stop"
	} else if (vertical !== 0 && horizontal === 0) {
		return "straight"
	} else if (vertical === 0 && horizontal !== 0) {
		return "spin"
	} else {
		return "turn"
	}
}

/**
 * Applies linear throttle using the formula: min_speed + throttle% * (max_speed - min_speed) / 100
 */
function applyLinearThrottle(throttlePercent: number, minSpeed: number, maxSpeed: number): number {
	return minSpeed + (throttlePercent * (maxSpeed - minSpeed)) / 100
}

/**
 * Calculates motor speeds based on movement classification and linear throttle
 */
// eslint-disable-next-line max-lines-per-function, complexity
export default function calculateMotorSpeeds(data: Omit<MotorControlData, "pipUUID">): MotorSpeeds {
	const { vertical, horizontal } = data.motorControl
	const { motorThrottlePercent } = data

	// Classify the movement type
	const movementType = classifyMovement(vertical, horizontal)

	// Get speed configuration for this movement type
	const speedConfig = SPEED_CONFIGS[movementType]

	// Apply linear throttle
	const baseSpeed = applyLinearThrottle(motorThrottlePercent, speedConfig.minSpeed, speedConfig.maxSpeed)

	// Initialize motor speeds
	const speeds: MotorSpeeds = { leftMotor: 0, rightMotor: 0 }

	// Calculate motor speeds based on movement type and direction
	switch (movementType) {
	case "stop": {
		speeds.leftMotor = 0
		speeds.rightMotor = 0
		break
	}
	case "straight": {
	// Both motors move at the same speed, direction determined by vertical input
		const straightSpeed = vertical > 0 ? baseSpeed : -baseSpeed
		speeds.leftMotor = straightSpeed
		speeds.rightMotor = straightSpeed
		break
	}

	case "spin": {
		// Motors move in opposite directions, speed determined by horizontal input
		const spinSpeed = horizontal > 0 ? baseSpeed : -baseSpeed
		speeds.leftMotor = spinSpeed
		speeds.rightMotor = -spinSpeed
		break
	}

	case "turn": {
		// One motor moves at full speed, the other at reduced speed
		// Direction and which motor is reduced depends on the combination
		if (vertical > 0) {
			// Forward turn
			if (horizontal > 0) {
				// Forward + Right: left motor full speed, right motor reduced
				speeds.leftMotor = baseSpeed
				speeds.rightMotor = baseSpeed * 0.5
			} else {
				// Forward + Left: right motor full speed, left motor reduced
				speeds.leftMotor = baseSpeed * 0.5
				speeds.rightMotor = baseSpeed
			}
		} else {
			// Backward turn
			if (horizontal > 0) {
				// Backward + Right: right motor full speed, left motor reduced
				speeds.leftMotor = -baseSpeed * 0.5
				speeds.rightMotor = -baseSpeed
			} else {
				// Backward + Left: left motor full speed, right motor reduced
				speeds.leftMotor = -baseSpeed
				speeds.rightMotor = -baseSpeed * 0.5
			}
		}
		break
	}
	}

	return speeds
}
