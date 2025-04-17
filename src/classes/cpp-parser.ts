/* eslint-disable max-depth */
import { MAX_LED_BRIGHTNESS } from "../utils/constants"
import { BytecodeOpCode, CommandPatterns, CommandType, ComparisonOp, LedID, SensorType, VarType } from "../types/bytecode-types"

export default class CppParser {
	public static cppToByte(unsanitizedCpp: string): Uint8Array<ArrayBufferLike> {
		const sanitizedCode = this.sanitizeUserCode(unsanitizedCpp)
		const instructions = this.parseCppCode(sanitizedCode)
		const bytecode = this.generateBytecode(instructions)

		return bytecode
	}

	private static identifyCommand(statement: string): ValidCommand | null {
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

	// eslint-disable-next-line max-lines-per-function, complexity
	private static parseCppCode(cppCode: string): BytecodeInstruction[] {
		const instructions: BytecodeInstruction[] = []
		const variables: Map<string, { type: VarType, register: number }> = new Map()
		let nextRegister = 0

		const protectedStatements = cppCode.split(";").map(s => s.trim()).filter(s => s.length > 0)

		// Now restore the semicolons in each statement
		const statements = protectedStatements.map(s => s.replace(/###SEMICOLON###/g, ";"))

		const blockStack: BlockStack[] = []
		const pendingJumps: PendingJumps[] = []

		for (const statement of statements) {
			const command = this.identifyCommand(statement)

			if (!command) {
				throw new Error(`Invalid command: "${statement}"`)
			}

			switch (command.type) {
			case CommandType.FOR_STATEMENT: {
				if (command.matches && command.matches.length === 4) {
					const varName = command.matches[1]
					const startValue = parseInt(command.matches[2], 10)
					const endValue = parseInt(command.matches[3], 10)

					// Assign register for loop counter
					const register = nextRegister++
					variables.set(varName, {type: VarType.INT, register})

					// FOR_INIT: Initialize counter variable
					instructions.push({
						opcode: BytecodeOpCode.FOR_INIT,
						operand1: register,
						operand2: startValue & 0xFF,
						operand3: (startValue >> 8) & 0xFF,
						operand4: (startValue >> 16) & 0xFF
					})

					// Remember position for the condition check
					const forStartIndex = instructions.length

					// FOR_CONDITION: Check if counter < end value
					instructions.push({
						opcode: BytecodeOpCode.FOR_CONDITION,
						operand1: register,
						operand2: endValue & 0xFF,
						operand3: (endValue >> 8) & 0xFF,
						operand4: (endValue >> 16) & 0xFF
					})

					// Add jump-if-false to skip loop body when done
					const jumpIfFalseIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Track this for loop for later
					blockStack.push({
						type: "for",
						jumpIndex: jumpIfFalseIndex,
						varRegister: register,
						startIndex: forStartIndex
					})
				}
				break
			}

			case CommandType.WHILE_STATEMENT: {
				const whileStartIndex = instructions.length
				instructions.push({
					opcode: BytecodeOpCode.WHILE_START,
					operand1: 0,
					operand2: 0,
					operand3: 0,
					operand4: 0
				})

				// Track this while block for later
				blockStack.push({ type: "while", jumpIndex: whileStartIndex })
				break
			}

			case CommandType.VARIABLE_ASSIGNMENT:
				if (command.matches && command.matches.length === 4) {
					const varType = command.matches[1] // float, int, bool
					const varName = command.matches[2]
					const varValue = command.matches[3]

					// Convert type string to enum
					let typeEnum: VarType
					switch (varType) {
					case "float": typeEnum = VarType.FLOAT; break
					case "int": typeEnum = VarType.INT; break
					case "bool": typeEnum = VarType.BOOL; break
					default: throw new Error(`Unsupported type: ${varType}`)
					}

					// Assign register and store for future reference
					const register = nextRegister++
					variables.set(varName, {type: typeEnum, register})

					// Generate DECLARE_VAR instruction
					instructions.push({
						opcode: BytecodeOpCode.DECLARE_VAR,
						operand1: register,
						operand2: typeEnum,
						operand3: 0,
						operand4: 0
					})

					if (typeEnum === VarType.FLOAT) {
						const floatValue = parseFloat(varValue)
						// Convert float to bytes (need to handle in special way)
						const bytes = this.floatToBytes(floatValue)

						instructions.push({
							opcode: BytecodeOpCode.SET_VAR,
							operand1: register,
							operand2: bytes[0],
							operand3: bytes[1],
							operand4: bytes[2] // Note: losing 1 byte of precision
						})
					} else if (typeEnum === VarType.BOOL) {
						// Parse boolean value - handle both "true"/"false" and 1/0
						let boolValue: boolean
						if (varValue.trim().toLowerCase() === "true" || varValue.trim() === "1") {
							boolValue = true
						} else if (varValue.trim().toLowerCase() === "false" || varValue.trim() === "0") {
							boolValue = false
						} else {
							throw new Error(`Invalid boolean value: ${varValue}`)
						}

						instructions.push({
							opcode: BytecodeOpCode.SET_VAR,
							operand1: register,
							operand2: boolValue ? 1 : 0, // 1 for true, 0 for false
							operand3: 0,
							operand4: 0
						})
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					} else if (typeEnum === VarType.INT) {
						// Parse integer value
						const intValue = parseInt(varValue.trim(), 10)

						if (isNaN(intValue)) {
							throw new Error(`Invalid integer value: ${varValue}`)
						}

						// Split the integer into 3 bytes (supporting values up to 16,777,215)
						// We're using 24-bit integers with sign bit
						instructions.push({
							opcode: BytecodeOpCode.SET_VAR,
							operand1: register,
							operand2: intValue & 0xFF,         // Low byte
							operand3: (intValue >> 8) & 0xFF,  // Middle byte
							operand4: (intValue >> 16) & 0xFF  // High byte (includes sign bit)
						})
					}
				}
				break

			case CommandType.TURN_LED_OFF:
				instructions.push({
					opcode: BytecodeOpCode.SET_ALL_LEDS,
					operand1: 0,
					operand2: 0,
					operand3: 0,
					operand4: 0
				})
				break

			case CommandType.SET_LED_RED:
				instructions.push({
					opcode: BytecodeOpCode.SET_ALL_LEDS,
					operand1: MAX_LED_BRIGHTNESS,
					operand2: 0,
					operand3: 0,
					operand4: 0
				})
				break

			case CommandType.SET_LED_GREEN:
				instructions.push({
					opcode: BytecodeOpCode.SET_ALL_LEDS,
					operand1: 0,
					operand2: MAX_LED_BRIGHTNESS,
					operand3: 0,
					operand4: 0
				})
				break

			case CommandType.SET_LED_BLUE:
				instructions.push({
					opcode: BytecodeOpCode.SET_ALL_LEDS,
					operand1: 0,
					operand2: 0,
					operand3: MAX_LED_BRIGHTNESS,
					operand4: 0
				})
				break

			case CommandType.SET_LED_WHITE:
				instructions.push({
					opcode: BytecodeOpCode.SET_ALL_LEDS,
					operand1: MAX_LED_BRIGHTNESS,
					operand2: MAX_LED_BRIGHTNESS,
					operand3: MAX_LED_BRIGHTNESS,
					operand4: 0
				})
				break

			case CommandType.SET_LED_PURPLE:
				instructions.push({
					opcode: BytecodeOpCode.SET_ALL_LEDS,
					operand1: MAX_LED_BRIGHTNESS,
					operand2: 0,
					operand3: MAX_LED_BRIGHTNESS,
					operand4: 0
				})
				break

			case CommandType.SET_ALL_LEDS:
				if (command.matches && command.matches.length === 4) {
					instructions.push({
						opcode: BytecodeOpCode.SET_ALL_LEDS,
						operand1: parseInt(command.matches[1], 10),
						operand2: parseInt(command.matches[2], 10),
						operand3: parseInt(command.matches[3], 10),
						operand4: 0
					})
				}
				break

			case CommandType.SET_TOP_LEFT_LED:
				this.handleIndividualLed(command.matches, LedID.TOP_LEFT, instructions)
				break

			case CommandType.SET_TOP_RIGHT_LED:
				this.handleIndividualLed(command.matches, LedID.TOP_RIGHT, instructions)
				break

			case CommandType.SET_MIDDLE_LEFT_LED:
				this.handleIndividualLed(command.matches, LedID.MIDDLE_LEFT, instructions)
				break

			case CommandType.SET_MIDDLE_RIGHT_LED:
				this.handleIndividualLed(command.matches, LedID.MIDDLE_RIGHT, instructions)
				break

			case CommandType.SET_BACK_LEFT_LED:
				this.handleIndividualLed(command.matches, LedID.BACK_LEFT, instructions)
				break

			case CommandType.SET_BACK_RIGHT_LED:
				this.handleIndividualLed(command.matches, LedID.BACK_RIGHT, instructions)
				break

			case CommandType.DELAY:
				if (command.matches && command.matches.length === 2) {
					const delayMs = parseInt(command.matches[1], 10)
					instructions.push({
						opcode: BytecodeOpCode.DELAY,
						operand1: delayMs & 0xFF, // Low byte
						operand2: (delayMs >> 8) & 0xFF, // High byte
						operand3: 0,
						operand4: 0
					})
				}
				break

			case CommandType.IF_STATEMENT: {
				if (command.matches && command.matches.length === 4) {
					const leftExpr = command.matches[1]
					const operator = command.matches[2]
					const rightValue = parseInt(command.matches[3], 10)

					// First check if left side is a sensor expression
					// eslint-disable-next-line max-len
					const sensorMatch = leftExpr.match(/Sensors::getInstance\(\)\.(getPitch|getRoll|getYaw|getXAccel|getYAccel|getZAccel|getAccelMagnitude|getXRotationRate|getYRotationRate|getZRotationRate|getMagneticFieldX|getMagneticFieldY|getMagneticFieldZ)\(\)/)

					if (sensorMatch) {
						// This is a sensor comparison
						const sensorMethod = sensorMatch[1]
						let sensorType: number

						// Map method name to sensor type
						switch (sensorMethod) {
						case "getPitch": sensorType = SensorType.PITCH; break
						case "getRoll": sensorType = SensorType.ROLL; break
						case "getYaw": sensorType = SensorType.YAW; break
						case "getXAccel": sensorType = SensorType.ACCEL_X; break
						case "getYAccel": sensorType = SensorType.ACCEL_Y; break
						case "getZAccel": sensorType = SensorType.ACCEL_Z; break
						case "getAccelMagnitude": sensorType = SensorType.ACCEL_MAG; break
						case "getXRotationRate": sensorType = SensorType.ROT_RATE_X; break
						case "getYRotationRate": sensorType = SensorType.ROT_RATE_Y; break
						case "getZRotationRate": sensorType = SensorType.ROT_RATE_Z; break
						case "getMagneticFieldX": sensorType = SensorType.MAG_FIELD_X; break
						case "getMagneticFieldY": sensorType = SensorType.MAG_FIELD_Y; break
						case "getMagneticFieldZ": sensorType = SensorType.MAG_FIELD_Z; break
						default: throw new Error(`Unknown sensor method: ${sensorMethod}`)
						}

						// Allocate a register for the sensor value
						const register = nextRegister++

						// Add instruction to read sensor into register
						instructions.push({
							opcode: BytecodeOpCode.READ_SENSOR,
							operand1: sensorType,
							operand2: register,
							operand3: 0,
							operand4: 0
						})

						// Map operator to ComparisonOp
						let compOp: ComparisonOp
						switch (operator) {
						case ">": compOp = ComparisonOp.GREATER_THAN; break
						case "<": compOp = ComparisonOp.LESS_THAN; break
						case ">=": compOp = ComparisonOp.GREATER_EQUAL; break
						case "<=": compOp = ComparisonOp.LESS_EQUAL; break
						case "==": compOp = ComparisonOp.EQUAL; break
						case "!=": compOp = ComparisonOp.NOT_EQUAL; break
						default: throw new Error(`Unsupported operator: ${operator}`)
						}

						// Add comparison instruction with register as left operand
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp,
							operand2: 0x80 | register, // High bit indicates register reference
							operand3: rightValue & 0xFF,
							operand4: (rightValue >> 8) & 0xFF
						})
					} else {
						// Standard constant comparison (existing code)
						const leftValue = parseInt(leftExpr, 10)

						// Map operator to ComparisonOp
						let compOp: ComparisonOp
						switch (operator) {
						case ">": compOp = ComparisonOp.GREATER_THAN; break
						case "<": compOp = ComparisonOp.LESS_THAN; break
						case ">=": compOp = ComparisonOp.GREATER_EQUAL; break
						case "<=": compOp = ComparisonOp.LESS_EQUAL; break
						case "==": compOp = ComparisonOp.EQUAL; break
						case "!=": compOp = ComparisonOp.NOT_EQUAL; break
						default: throw new Error(`Unsupported operator: ${operator}`)
						}

						// Add comparison instruction with constants
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp,
							operand2: leftValue,
							operand3: rightValue,
							operand4: 0
						})
					}

					// Add conditional jump (to be fixed later) - this remains the same
					const jumpIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Track this block for later
					blockStack.push({ type: "if", jumpIndex })
				}
				break
			}
			case CommandType.BLOCK_START:
				// Nothing special for block start
				break

			case CommandType.BLOCK_END:
				if (blockStack.length > 0) {
					const block = blockStack.pop() as BlockStack

					if (block.type === "for") {
						// Add FOR_INCREMENT instruction
						instructions.push({
							opcode: BytecodeOpCode.FOR_INCREMENT,
							operand1: block.varRegister as number,
							operand2: 0,
							operand3: 0,
							operand4: 0
						})

						// Jump back to condition check
						const forEndIndex = instructions.length
						const offsetToStart = (forEndIndex - (block.startIndex as number)) * 5

						instructions.push({
							opcode: BytecodeOpCode.JUMP_BACKWARD,
							operand1: offsetToStart & 0xFF,
							operand2: (offsetToStart >> 8) & 0xFF,
							operand3: 0,
							operand4: 0
						})

						// Fix the jump-if-false at start to point here
						const offsetToHere = (instructions.length - block.jumpIndex) * 5
						instructions[block.jumpIndex].operand1 = offsetToHere & 0xFF
						instructions[block.jumpIndex].operand2 = (offsetToHere >> 8) & 0xFF
					} else if (block.type === "while") {
						// Add a WHILE_END instruction that jumps back to the start
						const whileEndIndex = instructions.length

						// Calculate bytes to jump back (each instruction is 5 bytes)
						const offsetToStart = (whileEndIndex - block.jumpIndex) * 5

						instructions.push({
							opcode: BytecodeOpCode.WHILE_END,
							operand1: offsetToStart & 0xFF, // Low byte
							operand2: (offsetToStart >> 8) & 0xFF, // High byte
							operand3: 0,
							operand4: 0
						})
					} else if (block.type === "if") {
 						// Check if there's an "else" coming next by looking ahead
						const nextStatementIndex = statements.indexOf(statement) + 1
						const hasElseNext = nextStatementIndex < statements.length &&
                                                statements[nextStatementIndex].trim() === "else"

						if (hasElseNext) {
							const offsetToElseBlock = (instructions.length + 1 - block.jumpIndex) * 5
							instructions[block.jumpIndex].operand1 = offsetToElseBlock & 0xFF
							instructions[block.jumpIndex].operand2 = (offsetToElseBlock >> 8) & 0xFF

							// Add jump to skip else block
							const skipElseIndex = instructions.length
							instructions.push({
								opcode: BytecodeOpCode.JUMP,
								operand1: 0, // Will be filled later
								operand2: 0,
								operand3: 0,
								operand4: 0
							})

							// Save for fixing after else block
							pendingJumps.push({ index: skipElseIndex, targetType: "end_of_else" })
						} else {
							// No else block, so jump-if-false should point to the current position
							const offsetToEndOfIf = (instructions.length - block.jumpIndex) * 5
							instructions[block.jumpIndex].operand1 = offsetToEndOfIf & 0xFF
							instructions[block.jumpIndex].operand2 = (offsetToEndOfIf >> 8) & 0xFF
						}
					} else if (block.type === "else") {
						for (let i = pendingJumps.length - 1; i >= 0; i--) {
							const jump = pendingJumps[i]
							if (jump.targetType === "end_of_else") {
								const offsetToEnd = (instructions.length - jump.index) * 5
								instructions[jump.index].operand1 = offsetToEnd & 0xFF
								instructions[jump.index].operand2 = (offsetToEnd >> 8) & 0xFF
								pendingJumps.splice(i, 1)
							}
						}
					}
				}
				break

			case CommandType.ELSE_STATEMENT:
				// Mark start of else block
				blockStack.push({ type: "else", jumpIndex: instructions.length })
				break

                // End of switch statement
			}
		}

		// Add END instruction at the end
		instructions.push({
			opcode: BytecodeOpCode.END,
			operand1: 0,
			operand2: 0,
			operand3: 0,
			operand4: 0
		})

		return instructions
	}

	private static handleIndividualLed(matches: RegExpMatchArray | null, ledId: LedID, instructions: BytecodeInstruction[]): void {
		if (matches && matches.length === 4) {
			instructions.push({
				opcode: BytecodeOpCode.SET_LED,
				operand1: ledId,
				operand2: parseInt(matches[1], 10), // Red
				operand3: parseInt(matches[2], 10), // Green
				operand4: parseInt(matches[3], 10)  // Blue
			})
		}
	}

	private static generateBytecode(instructions: BytecodeInstruction[]): Uint8Array {
		// Each instruction is 5 bytes
		const bytecode = new Uint8Array(instructions.length * 5)

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

	private static sanitizeUserCode(userCode: string): string {
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
		// Make sure else is a separate token
			.replace(/}\s*else/g, "} ; else")
		// Normalize whitespace
			.replace(/\s+/g, " ")
		// Escape single quotes
			.replace(/'/g, "'\\''")

		// NOTE: We are NOT restoring semicolons here!
		// We'll restore them after splitting into statements
	}

	private static floatToBytes(value: number): Uint8Array {
		const buffer = new ArrayBuffer(4)
		const view = new DataView(buffer)
		view.setFloat32(0, value, true) // little-endian
		return new Uint8Array(buffer)
	}
}
