/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
import { BytecodeOpCode, CommandPatterns, CommandType, ComparisonOp, SensorType } from "@/types/bytecode-types"
import { BytecodeInstruction, VariableType, ValidCommand, CharacterStack } from "@/types/bytecode"
import { MAX_REGISTERS } from "@/utils/constants/constants"

export class CppParserHelper {
	static sanitizeUserCode(userCode: string): string {
		// STEP 1: Find for loop declarations and protect their semicolons
		let cleanUserCode = userCode

		const forLoopRegex = /for\s*\(\s*int\s+\w+\s*=\s*\d+\s*;\s*\w+\s*[<>=!][=]?\s*\d+\s*;\s*\w+\s*\+\+\s*\)/g
		cleanUserCode = cleanUserCode.replace(forLoopRegex, (match) => {
			return match.replace(/;/g, "###SEMICOLON###")
		})

		// STEP 2: Normal sanitization
		return cleanUserCode
			.trim()
		// Remove comments
			.replace(/\/\/.*$/gm, "")
			.replace(/\/\*[\s\S]*?\*\//g, "")
		// Add spaces around braces and make them separate tokens
			.replace(/{/g, " ; { ; ")
			.replace(/}/g, " ; } ; ")
		// Make sure else if and else are separate tokens (order matters - else if first)
			.replace(/}\s*else\s+if/g, "} ; else if")
			.replace(/}\s*else/g, "} ; else")
		// Normalize whitespace
			.replace(/\s+/g, " ")
		// Escape single quotes
			.replace(/'/g, "'\\''")

		// NOTE: We are NOT restoring semicolons here!
		// We'll restore them after splitting into statements
	}

	static validateBalancedSyntax(code: string): boolean | string {
		const stack: CharacterStack[] = []
		const pairs: Record<string, string> = {
			"{": "}",
			"(": ")",
			"[": "]"
		}

		for (let i = 0; i < code.length; i++) {
			const char = code[i]

			// Skip characters in strings
			if (char === "\"" || char === "'") {
				// Simple string skipping - you might need more sophisticated logic
				const quote = char
				i++
				while (i < code.length && code[i] !== quote) {
					if (code[i] === "\\") i++ // Skip escaped characters
					i++
				}
				continue
			}

			// Skip comments
			if (char === "/" && i + 1 < code.length) {
				if (code[i + 1] === "/") {
					// Line comment - skip to end of line
					while (i < code.length && code[i] !== "\n") i++
					continue
				} else if (code[i + 1] === "*") {
					// Block comment - skip to */
					i += 2
					while (i + 1 < code.length && !(code[i] === "*" && code[i + 1] === "/")) i++
					i++ // Skip the closing /
					continue
				}
			}

			// Handle brackets
			if ("{([".includes(char)) {
				stack.push({ char, pos: i })
			} else if ("})]".includes(char)) {
				if (stack.length === 0) {
					return `Unexpected closing '${char}' at position ${i}`
				}

				const lastOpen = stack.pop() as CharacterStack
				if (pairs[lastOpen.char] !== char) {
					return `Expected '${pairs[lastOpen.char]}' but found '${char}' at position ${i}`
				}
			}
		}

		if (stack.length > 0) {
			const unclosed = stack[stack.length - 1]
			return `Unclosed '${unclosed.char}' at position ${unclosed.pos}`
		}

		return true
	}

	static identifyCommand(statement: string): ValidCommand | null {
		for (const [commandType, pattern] of Object.entries(CommandPatterns)) {
			const matches = statement.match(pattern)
			if (matches) {
				return {
					type: commandType as CommandType,
					matches
				}
			}
		}
		return null
	}

	static getSensorTypeFromMethod(sensorMethod: string): number {
		switch (sensorMethod) {
		case "getPitch": return SensorType.PITCH
		case "getRoll": return SensorType.ROLL
		case "getYaw": return SensorType.YAW
		case "getXAccel": return SensorType.ACCEL_X
		case "getYAccel": return SensorType.ACCEL_Y
		case "getZAccel": return SensorType.ACCEL_Z
		case "getAccelMagnitude": return SensorType.ACCEL_MAG
		case "getXRotationRate": return SensorType.ROT_RATE_X
		case "getYRotationRate": return SensorType.ROT_RATE_Y
		case "getZRotationRate": return SensorType.ROT_RATE_Z
		case "getMagneticFieldX": return SensorType.MAG_FIELD_X
		case "getMagneticFieldY": return SensorType.MAG_FIELD_Y
		case "getMagneticFieldZ": return SensorType.MAG_FIELD_Z
		default: throw new Error(`Unknown sensor method: ${sensorMethod}`)
		}
	}

	static parseComparisonOperator(operator: string): ComparisonOp {
		switch (operator) {
		case ">": return ComparisonOp.GREATER_THAN
		case "<": return ComparisonOp.LESS_THAN
		case ">=": return ComparisonOp.GREATER_EQUAL
		case "<=": return ComparisonOp.LESS_EQUAL
		case "==": return ComparisonOp.EQUAL
		case "!=": return ComparisonOp.NOT_EQUAL
		default: throw new Error(`Unsupported operator: ${operator}`)
		}
	}

	// Update the processOperand function in cpp-parser-helper.ts
	// Add this at the very beginning of the processOperand function, before any other checks:

	static processOperand(
		expr: string,
		variables: Map<string, VariableType>,
		nextRegister: number,
		instructions: BytecodeInstruction[]
	): { operand: number, updatedNextRegister: number } {
		// Check if this is a boolean literal first (before checking variables)
		const trimmedExpr = expr.trim()
		if (trimmedExpr === "true") {
			return { operand: 1.0, updatedNextRegister: nextRegister }
		} else if (trimmedExpr === "false") {
			return { operand: 0.0, updatedNextRegister: nextRegister }
		}

		// Check if this is a button press detection function
		const buttonMatch = expr.match(CommandPatterns[CommandType.CHECK_IF_RIGHT_BUTTON_PRESSED])
		if (buttonMatch) {
			// Allocate a register for the button state
			if (nextRegister >= MAX_REGISTERS) {
				throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
			}
			const register = nextRegister++

			// Add instruction to check button state into register
			instructions.push({
				opcode: BytecodeOpCode.CHECK_RIGHT_BUTTON_PRESS,
				operand1: register,
				operand2: 0,
				operand3: 0,
				operand4: 0
			})

			return { operand: 0x8000 | register, updatedNextRegister: nextRegister }
		}

		// Check if this is a proximity detection function
		const leftDistanceSensorMatch = expr.match(CommandPatterns[CommandType.LEFT_DISTANCE_SENSOR])
		const rightDistanceSensorMatch = expr.match(CommandPatterns[CommandType.RIGHT_DISTANCE_SENSOR])
		const frontProximityMatch = expr.match(CommandPatterns[CommandType.FRONT_PROXIMITY_DETECTION])
		const proximityMatch = leftDistanceSensorMatch || rightDistanceSensorMatch || frontProximityMatch
		if (proximityMatch) {
		// Determine the sensor type based on the function name
			let sensorType: SensorType
			if (frontProximityMatch) {
				sensorType = SensorType.FRONT_PROXIMITY
			} else if (leftDistanceSensorMatch) {
				sensorType = SensorType.SIDE_LEFT_PROXIMITY
			} else if (rightDistanceSensorMatch) {
				sensorType = SensorType.SIDE_RIGHT_PROXIMITY
			} else {
				throw new Error(`Unknown proximity detection: ${expr}`)
			}

			// Allocate a register for the sensor value
			if (nextRegister >= MAX_REGISTERS) {
				throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
			}
			const register = nextRegister++

			// Add instruction to read sensor into register
			instructions.push({
				opcode: BytecodeOpCode.READ_SENSOR,
				operand1: sensorType,
				operand2: register,
				operand3: 0,
				operand4: 0
			})

			return { operand: 0x8000 | register, updatedNextRegister: nextRegister }
		}

		// Check if this is a color detection function
		const colorMatch = expr.match(CommandPatterns[CommandType.COLOR_SENSOR_READ])
		if (colorMatch) {
			// Extract color from the regex match
			const colorName = colorMatch[1] // RED, GREEN, BLUE, WHITE, BLACK, YELLOW
			let sensorType: SensorType

			switch (colorName) {
			case "RED": sensorType = SensorType.SENSOR_COLOR_RED; break
			case "GREEN": sensorType = SensorType.SENSOR_COLOR_GREEN; break
			case "BLUE": sensorType = SensorType.SENSOR_COLOR_BLUE; break
			case "WHITE": sensorType = SensorType.SENSOR_COLOR_WHITE; break
			case "BLACK": sensorType = SensorType.SENSOR_COLOR_BLACK; break
			case "YELLOW": sensorType = SensorType.SENSOR_COLOR_YELLOW; break
			default: throw new Error(`Unsupported color: ${colorName}`)
			}

			// Allocate a register for the sensor value
			if (nextRegister >= MAX_REGISTERS) {
				throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
			}
			const register = nextRegister++

			// Add instruction to read sensor into register
			instructions.push({
				opcode: BytecodeOpCode.READ_SENSOR,
				operand1: sensorType,
				operand2: register,
				operand3: 0,
				operand4: 0
			})

			return { operand: 0x8000 | register, updatedNextRegister: nextRegister }
		}

		// Check if this is a TOF distance sensor reading
		const tofMatch = expr.match(CommandPatterns[CommandType.GET_FRONT_TOF_DISTANCE])
		if (tofMatch) {
			// Allocate a register for the TOF distance value
			if (nextRegister >= MAX_REGISTERS) {
				throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
			}
			const register = nextRegister++

			// Add instruction to read TOF distance sensor into register
			instructions.push({
				opcode: BytecodeOpCode.READ_SENSOR,
				operand1: SensorType.FRONT_TOF_DISTANCE,
				operand2: register,
				operand3: 0,
				operand4: 0
			})

			return { operand: 0x8000 | register, updatedNextRegister: nextRegister }
		}

		// Check if this is an IMU sensor reading
		const imuMatch = expr.match(CommandPatterns[CommandType.IMU_READ])
		if (imuMatch) {
		// This is an IMU sensor reading
			const sensorMethod = imuMatch[1]
			const sensorType = this.getSensorTypeFromMethod(sensorMethod)

			// Allocate a register for the sensor value
			if (nextRegister >= MAX_REGISTERS) {
				throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
			}
			const register = nextRegister++

			// Add instruction to read IMU sensor into register
			instructions.push({
				opcode: BytecodeOpCode.READ_SENSOR,
				operand1: sensorType,
				operand2: register,
				operand3: 0,
				operand4: 0
			})

			return { operand: 0x8000 | register, updatedNextRegister: nextRegister }
		} else if (variables.has(expr)) {
		// This is a variable reference
			const variable = variables.get(expr) as VariableType
			return { operand: 0x8000 | variable.register, updatedNextRegister: nextRegister }
		} else {
		// This is a numeric constant
			const value = parseFloat(expr)
			if (isNaN(value)) {
				throw new Error(`Undefined variable or invalid number: ${expr}`)
			}
			return { operand: value, updatedNextRegister: nextRegister }
		}
	}

	static getSensorTypeFromProximity(proximityType: string): SensorType {
		switch (proximityType) {
		case "left": return SensorType.SIDE_LEFT_PROXIMITY
		case "right": return SensorType.SIDE_RIGHT_PROXIMITY
		case "front": return SensorType.FRONT_PROXIMITY
		default: throw new Error(`Unknown proximity type: ${proximityType}`)
		}
	}

	static generateBytecode(instructions: BytecodeInstruction[]): Float32Array {
		// Each instruction now uses 5 Float32 values
		const bytecode = new Float32Array(instructions.length * 5)

		instructions.forEach((instruction, index) => {
			const offset = index * 5
			bytecode[offset] = instruction.opcode
			bytecode[offset + 1] = instruction.operand1
			bytecode[offset + 2] = instruction.operand2
			bytecode[offset + 3] = instruction.operand3
			bytecode[offset + 4] = instruction.operand4
		})

		return bytecode
	}
}
