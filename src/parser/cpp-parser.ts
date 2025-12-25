/* eslint-disable max-len, complexity, max-lines-per-function, max-depth */
import { MAX_PROGRAM_SIZE, MAX_REGISTERS, MAX_LED_BRIGHTNESS, MAX_JUMP_DISTANCE, INSTRUCTION_SIZE } from "../utils/constants/constants"
import { ToneType } from "@actamayev/lever-labs-common-ts/protocol"
import { CommandType, BytecodeOpCode, CommandPatterns, SensorType, VarType, ComparisonOp, comparisonOperatorPattern } from "../types/bytecode-types"
import { CppParserHelper } from "./cpp-parser-helper"
import { BytecodeInstruction, BlockStack, PendingJumps, VariableType } from "@/types/bytecode"

export class CppParser {
	public static cppToByte(unsanitizedCpp: string): Float32Array {
		const sanitizedCode = CppParserHelper.sanitizeUserCode(unsanitizedCpp)
		const validationResult = CppParserHelper.validateBalancedSyntax(sanitizedCode)
		if (validationResult !== true) {
		  throw new Error(`Syntax error: ${validationResult}`)
		}
		const instructions = this.parseCppCode(sanitizedCode)

		if (instructions.length > MAX_PROGRAM_SIZE) {
		  throw new Error(`Program exceeds maximum size (${instructions.length} instructions, maximum is ${MAX_PROGRAM_SIZE})`)
		}

		const bytecode = CppParserHelper.generateBytecode(instructions)
		return bytecode
	}

	private static parseCppCode(cppCode: string): BytecodeInstruction[] {
		const instructions: BytecodeInstruction[] = []
		const variables: Map<string, VariableType> = new Map()
		let nextRegister = 0

		const protectedStatements = cppCode.split(";").map(s => s.trim()).filter(s => s.length > 0)

		// Now restore the semicolons in each statement
		const statements = protectedStatements.map(s => s.replace(/###SEMICOLON###/g, ";"))

		const blockStack: BlockStack[] = []
		const pendingJumps: PendingJumps[] = []

		for (const statement of statements) {
			// eslint-disable-next-line security/detect-unsafe-regex
			if (statement.match(/^if\s*\(\s*(?:.*?(?:&&|\|\|).*?){2,}/)) {
				throw new Error("Complex conditions with multiple logical operators are not supported")
			}

			// eslint-disable-next-line security/detect-unsafe-regex
			if (statement.match(/^else\s+if\s*\(\s*(?:.*?(?:&&|\|\|).*?){2,}/)) {
				throw new Error("Complex conditions with multiple logical operators are not supported")
			}
			const command = CppParserHelper.identifyCommand(statement)

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
					if (nextRegister >= MAX_REGISTERS) {
						throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
					}
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
					if (nextRegister >= MAX_REGISTERS) {
						throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
					}
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

					// Check if value is an IMU sensor reading
					const imuMatch = varValue.match(CommandPatterns[CommandType.IMU_READ])

					// Check if value is a TOF distance sensor reading
					const tofMatch = varValue.match(CommandPatterns[CommandType.GET_FRONT_TOF_DISTANCE])

					// Check if value is a button press detection function
					const buttonMatch = varValue.match(CommandPatterns[CommandType.CHECK_IF_RIGHT_BUTTON_PRESSED])

					// Check if value is a proximity detection function
					const leftDistanceSensorMatch = varValue.match(CommandPatterns[CommandType.LEFT_DISTANCE_SENSOR])
					const rightDistanceSensorMatch = varValue.match(CommandPatterns[CommandType.RIGHT_DISTANCE_SENSOR])
					const frontProximityMatch = varValue.match(CommandPatterns[CommandType.FRONT_PROXIMITY_DETECTION])

					// Check if value is a color detection function
					const colorMatch = varValue.match(CommandPatterns[CommandType.COLOR_SENSOR_READ])

					if (imuMatch) {
					// This is an IMU sensor reading assignment
						const sensorMethod = imuMatch[1]
						const sensorType = CppParserHelper.getSensorTypeFromMethod(sensorMethod)

						// Add instruction to read IMU sensor into the register
						instructions.push({
							opcode: BytecodeOpCode.READ_SENSOR,
							operand1: sensorType,
							operand2: register,
							operand3: 0,
							operand4: 0
						})
					} else if (tofMatch) {
					// This is a TOF distance sensor reading assignment
						instructions.push({
							opcode: BytecodeOpCode.READ_SENSOR,
							operand1: SensorType.FRONT_TOF_DISTANCE,
							operand2: register,
							operand3: 0,
							operand4: 0
						})
					} else if (typeEnum === VarType.BOOL && buttonMatch) {
					// This is a button press detection assignment to a boolean
						instructions.push({
							opcode: BytecodeOpCode.CHECK_RIGHT_BUTTON_PRESS,
							operand1: register,
							operand2: 0,
							operand3: 0,
							operand4: 0
						})
					} else if (typeEnum === VarType.BOOL && (leftDistanceSensorMatch || rightDistanceSensorMatch || frontProximityMatch)) {
						// This is a proximity sensor assignment to a boolean
						let sensorType: SensorType

						if (frontProximityMatch) {
							sensorType = SensorType.FRONT_PROXIMITY
						} else if (leftDistanceSensorMatch) {
							sensorType = SensorType.SIDE_LEFT_PROXIMITY
						} else if (rightDistanceSensorMatch) {
							sensorType = SensorType.SIDE_RIGHT_PROXIMITY
						} else {
							throw new Error(`Unknown proximity sensor: ${varValue}`)
						}

						// Add instruction to read proximity sensor into the register
						instructions.push({
							opcode: BytecodeOpCode.READ_SENSOR,
							operand1: sensorType,
							operand2: register,
							operand3: 0,
							operand4: 0
						})
					} else if (typeEnum === VarType.BOOL && colorMatch) {
						// This is a color sensor assignment to a boolean
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

						// Add instruction to read color sensor into the register
						instructions.push({
							opcode: BytecodeOpCode.READ_SENSOR,
							operand1: sensorType,
							operand2: register,
							operand3: 0,
							operand4: 0
						})
					} else if (typeEnum === VarType.FLOAT) {
						const floatValue = parseFloat(varValue)
						if (isNaN(floatValue)) {
							throw new Error(`Invalid float value: ${varValue}`)
						}

						instructions.push({
							opcode: BytecodeOpCode.SET_VAR,
							operand1: register,
							operand2: floatValue,
							operand3: 0,
							operand4: 0
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

						instructions.push({
							opcode: BytecodeOpCode.SET_VAR,
							operand1: register,
							operand2: intValue,   // Direct assignment of the full value
							operand3: 0,          // Can use for extended range if needed
							operand4: 0           // Can use for extended range if needed
						})
					}
				}
				break

			case CommandType.SET_LED_COLOR:
				if (command.matches && command.matches.length === 2) {
					const colorName = command.matches[1] // OFF, RED, GREEN, BLUE, WHITE, PURPLE, YELLOW
					let red = 0, green = 0, blue = 0

					switch (colorName) {
					case "OFF": red = 0; green = 0; blue = 0; break
					case "RED": red = MAX_LED_BRIGHTNESS; green = 0; blue = 0; break
					case "GREEN": red = 0; green = MAX_LED_BRIGHTNESS; blue = 0; break
					case "BLUE": red = 0; green = 0; blue = MAX_LED_BRIGHTNESS; break
					case "WHITE": red = MAX_LED_BRIGHTNESS; green = MAX_LED_BRIGHTNESS; blue = MAX_LED_BRIGHTNESS; break
					case "PURPLE": red = MAX_LED_BRIGHTNESS; green = 0; blue = MAX_LED_BRIGHTNESS; break
					case "YELLOW": red = MAX_LED_BRIGHTNESS; green = MAX_LED_BRIGHTNESS; blue = 0; break
					default: throw new Error(`Unsupported LED color: ${colorName}`)
					}

					instructions.push({
						opcode: BytecodeOpCode.SET_ALL_LEDS,
						operand1: red,
						operand2: green,
						operand3: blue,
						operand4: 0
					})
				}
				break

			case CommandType.WAIT:
				if (command.matches && command.matches.length === 2) {
					const delaySeconds = parseFloat(command.matches[1])

					instructions.push({
						opcode: BytecodeOpCode.WAIT,
						operand1: delaySeconds,
						operand2: 0,
						operand3: 0,
						operand4: 0
					})
				}
				break

			case CommandType.IF_STATEMENT: {
				if (command.matches) {
					// Extract the condition inside the parentheses
					const fullIfStatement = command.matches[0]
					const conditionMatch = fullIfStatement.match(/^if\s*\(\s*(.*?)\s*\)$/)

					if (!conditionMatch) {
						throw new Error(`Invalid if statement: ${fullIfStatement}`)
					}

					const condition = conditionMatch[1]

					// Check if this is a comparison (has a comparison operator) or a simple condition
					const comparisonMatch = condition.match(comparisonOperatorPattern)

					if (comparisonMatch) {
					// This is a comparison expression
						const leftExpr = comparisonMatch[1].trim()
						const operator = comparisonMatch[2].trim()
						const rightExpr = comparisonMatch[3].trim()

						// Parse comparison operator
						const compOp = CppParserHelper.parseComparisonOperator(operator)

						// Process left and right operands
						const leftResult = CppParserHelper.processOperand(leftExpr, variables, nextRegister, instructions)
						nextRegister = leftResult.updatedNextRegister

						const rightResult = CppParserHelper.processOperand(rightExpr, variables, nextRegister, instructions)
						nextRegister = rightResult.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp,
							operand2: leftResult.operand,
							operand3: rightResult.operand,
							operand4: 0
						})
					} else {
					// This is a simple condition (variable, front_distance_sensor.is_object_in_front(), etc.)
						const result = CppParserHelper.processOperand(condition, variables, nextRegister, instructions)
						nextRegister = result.updatedNextRegister

						// Add comparison with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result.operand,
							operand3: 1, // true
							operand4: 0
						})
					}

					// Add jump for if/else branching
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
						const offsetToStart = (forEndIndex - (block.startIndex as number)) * INSTRUCTION_SIZE

						if (offsetToStart > MAX_JUMP_DISTANCE) {
							throw new Error(`Jump distance in for loop too large (${offsetToStart} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
						}

						instructions.push({
							opcode: BytecodeOpCode.JUMP_BACKWARD,
							operand1: offsetToStart & 0xFF,
							operand2: (offsetToStart >> 8) & 0xFF,
							operand3: 0,
							operand4: 0
						})

						// Fix the jump-if-false at start to point here
						const offsetToHere = (instructions.length - block.jumpIndex) * INSTRUCTION_SIZE
						if (offsetToHere > MAX_JUMP_DISTANCE) {
							throw new Error(`Jump distance too large (${offsetToHere} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
						}
						instructions[block.jumpIndex].operand1 = offsetToHere & 0xFF
						instructions[block.jumpIndex].operand2 = (offsetToHere >> 8) & 0xFF
					} else if (block.type === "while") {
						// Add a WHILE_END instruction that jumps back to the start
						const whileEndIndex = instructions.length

						// Calculate bytes to jump back (each instruction is 10 bytes)
						const offsetToStart = (whileEndIndex - block.jumpIndex) * INSTRUCTION_SIZE

						if (offsetToStart > MAX_JUMP_DISTANCE) {
							throw new Error(`Jump distance in while loop too large (${offsetToStart} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
						}
						instructions.push({
							opcode: BytecodeOpCode.WHILE_END,
							operand1: offsetToStart & 0xFF, // Low byte
							operand2: (offsetToStart >> 8) & 0xFF, // High byte
							operand3: 0,
							operand4: 0
						})
					} else if (block.type === "if" || block.type === "else-if") {
						// Check if there's an "else if" or "else" coming next
						const nextStatementIndex = statements.indexOf(statement) + 1
						const hasElseIfNext = nextStatementIndex < statements.length &&
								(statements[nextStatementIndex].trim().startsWith("else if") ||
								 statements[nextStatementIndex].trim() === "else")

						if (hasElseIfNext) {
							// Calculate offset to the next else-if/else block
							const offsetToNextBlock = (instructions.length + 1 - block.jumpIndex) * INSTRUCTION_SIZE

							if (offsetToNextBlock > MAX_JUMP_DISTANCE) {
								throw new Error(`Jump distance too large (${offsetToNextBlock} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
							}
							// Update main jump index
							instructions[block.jumpIndex].operand1 = offsetToNextBlock & 0xFF
							instructions[block.jumpIndex].operand2 = (offsetToNextBlock >> 8) & 0xFF

							// Fix additional jumps if present (for compound conditions)
							if (block.additionalJumps) {
								for (const jumpIdx of block.additionalJumps) {
									// Calculate offset specifically for this jump
									const additionalJumpOffset = (instructions.length + 1 - jumpIdx) * INSTRUCTION_SIZE
									if (additionalJumpOffset > MAX_JUMP_DISTANCE) {
										throw new Error(`Jump distance too large (${additionalJumpOffset} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
									}
									instructions[jumpIdx].operand1 = additionalJumpOffset & 0xFF
									instructions[jumpIdx].operand2 = (additionalJumpOffset >> 8) & 0xFF
								}
							}

							// Add jump to skip the next else-if/else block when this block executes
							const skipNextBlockIndex = instructions.length
							instructions.push({
								opcode: BytecodeOpCode.JUMP,
								operand1: 0, // Will be filled later
								operand2: 0,
								operand3: 0,
								operand4: 0
							})

							// Save for fixing after the entire if-else-if-else chain is complete
							pendingJumps.push({ index: skipNextBlockIndex, targetType: "end_of_chain" })
						} else {
							// No more else-if or else blocks, so this is the end of the chain
							const offsetToEndOfChain = (instructions.length - block.jumpIndex) * INSTRUCTION_SIZE
							if (offsetToEndOfChain > MAX_JUMP_DISTANCE) {
								throw new Error(`Jump distance too large (${offsetToEndOfChain} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
							}

							// Update main jump index
							instructions[block.jumpIndex].operand1 = offsetToEndOfChain & 0xFF
							instructions[block.jumpIndex].operand2 = (offsetToEndOfChain >> 8) & 0xFF

							// Fix additional jumps if present
							if (block.additionalJumps) {
								for (const jumpIdx of block.additionalJumps) {
									instructions[jumpIdx].operand1 = offsetToEndOfChain & 0xFF
									instructions[jumpIdx].operand2 = (offsetToEndOfChain >> 8) & 0xFF
								}
							}

							// Fix all pending jumps that should point to the end of the chain
							for (let i = pendingJumps.length - 1; i >= 0; i--) {
								const jump = pendingJumps[i]
								if (jump.targetType === "end_of_chain") {
									const offsetToEnd = (instructions.length - jump.index) * INSTRUCTION_SIZE
									if (offsetToEnd > MAX_JUMP_DISTANCE) {
										throw new Error(`Jump distance too large (${offsetToEnd} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
									}
									instructions[jump.index].operand1 = offsetToEnd & 0xFF
									instructions[jump.index].operand2 = (offsetToEnd >> 8) & 0xFF
									pendingJumps.splice(i, 1)
								}
							}
						}
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					} else if (block.type === "else") {
						// Fix all pending jumps that should point to the end of the else block
						for (let i = pendingJumps.length - 1; i >= 0; i--) {
							const jump = pendingJumps[i]
							// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
							if (jump.targetType === "end_of_else" || jump.targetType === "end_of_chain") {
								const offsetToEnd = (instructions.length - jump.index) * INSTRUCTION_SIZE
								if (offsetToEnd > MAX_JUMP_DISTANCE) {
									throw new Error(`Jump distance too large (${offsetToEnd} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
								}
								instructions[jump.index].operand1 = offsetToEnd & 0xFF
								instructions[jump.index].operand2 = (offsetToEnd >> 8) & 0xFF
								pendingJumps.splice(i, 1)
							}
						}
					}
				}
				break

			case CommandType.COMPOUND_AND_IF_STATEMENT: {
				if (command.matches) {
					// Extract the full if statement
					const fullIfStatement = command.matches[0]

					// Extract the two subconditions using regex
					const conditionsMatch = fullIfStatement.match(/^if\s*\(\s*\((.+?)\)\s*&&\s*\((.+?)\)\s*\)$/)

					if (!conditionsMatch) {
						throw new Error(`Invalid compound AND statement: ${fullIfStatement}`)
					}

					const condition1 = conditionsMatch[1].trim()
					const condition2 = conditionsMatch[2].trim()

					// Parse first condition
					const condition1Parts = condition1.match(comparisonOperatorPattern)

					if (!condition1Parts) {
					// Handle simple condition (boolean variable or function)
						const result1 = CppParserHelper.processOperand(condition1, variables, nextRegister, instructions)
						nextRegister = result1.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result1.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
					// Handle comparison condition
						const leftExpr1 = condition1Parts[1].trim()
						const operator1 = condition1Parts[2].trim()
						const rightExpr1 = condition1Parts[3].trim()

						// Parse comparison operator
						const compOp1 = CppParserHelper.parseComparisonOperator(operator1)

						// Process operands
						const leftResult1 = CppParserHelper.processOperand(leftExpr1, variables, nextRegister, instructions)
						nextRegister = leftResult1.updatedNextRegister

						const rightResult1 = CppParserHelper.processOperand(rightExpr1, variables, nextRegister, instructions)
						nextRegister = rightResult1.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp1,
							operand2: leftResult1.operand,
							operand3: rightResult1.operand,
							operand4: 0
						})
					}

					// For AND, short-circuit if first condition is false
					const firstJumpIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Parse second condition (similar to first)
					const condition2Parts = condition2.match(comparisonOperatorPattern)

					if (!condition2Parts) {
					// Handle simple condition (boolean variable or function)
						const result2 = CppParserHelper.processOperand(condition2, variables, nextRegister, instructions)
						nextRegister = result2.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result2.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
					// Handle comparison condition
						const leftExpr2 = condition2Parts[1].trim()
						const operator2 = condition2Parts[2].trim()
						const rightExpr2 = condition2Parts[3].trim()

						// Parse comparison operator
						const compOp2 = CppParserHelper.parseComparisonOperator(operator2)

						// Process operands
						const leftResult2 = CppParserHelper.processOperand(leftExpr2, variables, nextRegister, instructions)
						nextRegister = leftResult2.updatedNextRegister

						const rightResult2 = CppParserHelper.processOperand(rightExpr2, variables, nextRegister, instructions)
						nextRegister = rightResult2.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp2,
							operand2: leftResult2.operand,
							operand3: rightResult2.operand,
							operand4: 0
						})
					}

					// Jump to else block if second condition is false
					const secondJumpIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Track this block for later
					blockStack.push({
						type: "if",
						jumpIndex: secondJumpIndex,
						additionalJumps: [firstJumpIndex] // Store additional jump points
					})
				}
				break
			}

			case CommandType.COMPOUND_OR_IF_STATEMENT: {
				if (command.matches) {
					// Extract the full if statement
					const fullIfStatement = command.matches[0]

					// Extract the two subconditions using regex
					const conditionsMatch = fullIfStatement.match(/^if\s*\(\s*\((.+?)\)\s*\|\|\s*\((.+?)\)\s*\)$/)

					if (!conditionsMatch) {
						throw new Error(`Invalid compound OR statement: ${fullIfStatement}`)
					}

					const condition1 = conditionsMatch[1].trim()
					const condition2 = conditionsMatch[2].trim()

					// Parse first condition (similar to AND case)
					const condition1Parts = condition1.match(comparisonOperatorPattern)

					if (!condition1Parts) {
					// Handle simple condition (boolean variable or function)
						const result1 = CppParserHelper.processOperand(condition1, variables, nextRegister, instructions)
						nextRegister = result1.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result1.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
					// Handle comparison condition
						const leftExpr1 = condition1Parts[1].trim()
						const operator1 = condition1Parts[2].trim()
						const rightExpr1 = condition1Parts[3].trim()

						// Parse comparison operator
						const compOp1 = CppParserHelper.parseComparisonOperator(operator1)

						// Process operands
						const leftResult1 = CppParserHelper.processOperand(leftExpr1, variables, nextRegister, instructions)
						nextRegister = leftResult1.updatedNextRegister

						const rightResult1 = CppParserHelper.processOperand(rightExpr1, variables, nextRegister, instructions)
						nextRegister = rightResult1.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp1,
							operand2: leftResult1.operand,
							operand3: rightResult1.operand,
							operand4: 0
						})
					}

					// For OR, short-circuit if first condition is true
					const jumpToIfBodyIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_TRUE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Parse second condition (similar to first)
					const condition2Parts = condition2.match(comparisonOperatorPattern)

					if (!condition2Parts) {
					// Handle simple condition (boolean variable or function)
						const result2 = CppParserHelper.processOperand(condition2, variables, nextRegister, instructions)
						nextRegister = result2.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result2.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
					// Handle comparison condition
						const leftExpr2 = condition2Parts[1].trim()
						const operator2 = condition2Parts[2].trim()
						const rightExpr2 = condition2Parts[3].trim()

						// Parse comparison operator
						const compOp2 = CppParserHelper.parseComparisonOperator(operator2)

						// Process operands
						const leftResult2 = CppParserHelper.processOperand(leftExpr2, variables, nextRegister, instructions)
						nextRegister = leftResult2.updatedNextRegister

						const rightResult2 = CppParserHelper.processOperand(rightExpr2, variables, nextRegister, instructions)
						nextRegister = rightResult2.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp2,
							operand2: leftResult2.operand,
							operand3: rightResult2.operand,
							operand4: 0
						})
					}

					// Jump to else block if second condition is also false
					const jumpToElseIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Now we're at the if-body. We need to fix the jumpToIfBodyIndex to point here
					const ifBodyOffset = (instructions.length - jumpToIfBodyIndex) * INSTRUCTION_SIZE
					if (ifBodyOffset > MAX_JUMP_DISTANCE) {
						throw new Error(`Jump distance too large (${ifBodyOffset} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
					}
					instructions[jumpToIfBodyIndex].operand1 = ifBodyOffset & 0xFF
					instructions[jumpToIfBodyIndex].operand2 = (ifBodyOffset >> 8) & 0xFF

					// Track this block for later
					blockStack.push({
						type: "if",
						jumpIndex: jumpToElseIndex
					})
				}
				break
			}

			// Add these cases to the switch statement in parseCppCode method

			case CommandType.ELSE_IF_STATEMENT: {
				if (command.matches) {
					// Extract the condition inside the parentheses
					const fullElseIfStatement = command.matches[0]
					const conditionMatch = fullElseIfStatement.match(/^else\s+if\s*\(\s*(.*?)\s*\)$/)

					if (!conditionMatch) {
						throw new Error(`Invalid else if statement: ${fullElseIfStatement}`)
					}

					const condition = conditionMatch[1]

					// Check if this is a comparison (has a comparison operator) or a simple condition
					const comparisonMatch = condition.match(comparisonOperatorPattern)

					if (comparisonMatch) {
						// This is a comparison expression
						const leftExpr = comparisonMatch[1].trim()
						const operator = comparisonMatch[2].trim()
						const rightExpr = comparisonMatch[3].trim()

						// Parse comparison operator
						const compOp = CppParserHelper.parseComparisonOperator(operator)

						// Process left and right operands
						const leftResult = CppParserHelper.processOperand(leftExpr, variables, nextRegister, instructions)
						nextRegister = leftResult.updatedNextRegister

						const rightResult = CppParserHelper.processOperand(rightExpr, variables, nextRegister, instructions)
						nextRegister = rightResult.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp,
							operand2: leftResult.operand,
							operand3: rightResult.operand,
							operand4: 0
						})
					} else {
						// This is a simple condition (variable, front_distance_sensor.is_object_in_front(), etc.)
						const result = CppParserHelper.processOperand(condition, variables, nextRegister, instructions)
						nextRegister = result.updatedNextRegister

						// Add comparison with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result.operand,
							operand3: 1, // true
							operand4: 0
						})
					}

					// Add jump for else-if branching
					const jumpIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Track this block for later
					blockStack.push({ type: "else-if", jumpIndex })
				}
				break
			}

			case CommandType.COMPOUND_AND_ELSE_IF_STATEMENT: {
				if (command.matches) {
					// Extract the full else if statement
					const fullElseIfStatement = command.matches[0]

					// Extract the two subconditions using regex
					const conditionsMatch = fullElseIfStatement.match(/^else\s+if\s*\(\s*\((.+?)\)\s*&&\s*\((.+?)\)\s*\)$/)

					if (!conditionsMatch) {
						throw new Error(`Invalid compound AND else if statement: ${fullElseIfStatement}`)
					}

					const condition1 = conditionsMatch[1].trim()
					const condition2 = conditionsMatch[2].trim()

					// Parse first condition
					const condition1Parts = condition1.match(comparisonOperatorPattern)

					if (!condition1Parts) {
						// Handle simple condition (boolean variable or function)
						const result1 = CppParserHelper.processOperand(condition1, variables, nextRegister, instructions)
						nextRegister = result1.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result1.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
						// Handle comparison condition
						const leftExpr1 = condition1Parts[1].trim()
						const operator1 = condition1Parts[2].trim()
						const rightExpr1 = condition1Parts[3].trim()

						// Parse comparison operator
						const compOp1 = CppParserHelper.parseComparisonOperator(operator1)

						// Process operands
						const leftResult1 = CppParserHelper.processOperand(leftExpr1, variables, nextRegister, instructions)
						nextRegister = leftResult1.updatedNextRegister

						const rightResult1 = CppParserHelper.processOperand(rightExpr1, variables, nextRegister, instructions)
						nextRegister = rightResult1.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp1,
							operand2: leftResult1.operand,
							operand3: rightResult1.operand,
							operand4: 0
						})
					}

					// For AND, short-circuit if first condition is false
					const firstJumpIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Parse second condition (similar to first)
					const condition2Parts = condition2.match(comparisonOperatorPattern)

					if (!condition2Parts) {
						// Handle simple condition (boolean variable or function)
						const result2 = CppParserHelper.processOperand(condition2, variables, nextRegister, instructions)
						nextRegister = result2.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result2.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
						// Handle comparison condition
						const leftExpr2 = condition2Parts[1].trim()
						const operator2 = condition2Parts[2].trim()
						const rightExpr2 = condition2Parts[3].trim()

						// Parse comparison operator
						const compOp2 = CppParserHelper.parseComparisonOperator(operator2)

						// Process operands
						const leftResult2 = CppParserHelper.processOperand(leftExpr2, variables, nextRegister, instructions)
						nextRegister = leftResult2.updatedNextRegister

						const rightResult2 = CppParserHelper.processOperand(rightExpr2, variables, nextRegister, instructions)
						nextRegister = rightResult2.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp2,
							operand2: leftResult2.operand,
							operand3: rightResult2.operand,
							operand4: 0
						})
					}

					// Jump to else block if second condition is false
					const secondJumpIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Track this block for later
					blockStack.push({
						type: "else-if",
						jumpIndex: secondJumpIndex,
						additionalJumps: [firstJumpIndex] // Store additional jump points
					})
				}
				break
			}

			case CommandType.COMPOUND_OR_ELSE_IF_STATEMENT: {
				if (command.matches) {
					// Extract the full else if statement
					const fullElseIfStatement = command.matches[0]

					// Extract the two subconditions using regex
					const conditionsMatch = fullElseIfStatement.match(/^else\s+if\s*\(\s*\((.+?)\)\s*\|\|\s*\((.+?)\)\s*\)$/)

					if (!conditionsMatch) {
						throw new Error(`Invalid compound OR else if statement: ${fullElseIfStatement}`)
					}

					const condition1 = conditionsMatch[1].trim()
					const condition2 = conditionsMatch[2].trim()

					// Parse first condition (similar to AND case)
					const condition1Parts = condition1.match(comparisonOperatorPattern)

					if (!condition1Parts) {
						// Handle simple condition (boolean variable or function)
						const result1 = CppParserHelper.processOperand(condition1, variables, nextRegister, instructions)
						nextRegister = result1.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result1.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
						// Handle comparison condition
						const leftExpr1 = condition1Parts[1].trim()
						const operator1 = condition1Parts[2].trim()
						const rightExpr1 = condition1Parts[3].trim()

						// Parse comparison operator
						const compOp1 = CppParserHelper.parseComparisonOperator(operator1)

						// Process operands
						const leftResult1 = CppParserHelper.processOperand(leftExpr1, variables, nextRegister, instructions)
						nextRegister = leftResult1.updatedNextRegister

						const rightResult1 = CppParserHelper.processOperand(rightExpr1, variables, nextRegister, instructions)
						nextRegister = rightResult1.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp1,
							operand2: leftResult1.operand,
							operand3: rightResult1.operand,
							operand4: 0
						})
					}

					// For OR, short-circuit if first condition is true
					const jumpToElseIfBodyIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_TRUE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Parse second condition (similar to first)
					const condition2Parts = condition2.match(comparisonOperatorPattern)

					if (!condition2Parts) {
						// Handle simple condition (boolean variable or function)
						const result2 = CppParserHelper.processOperand(condition2, variables, nextRegister, instructions)
						nextRegister = result2.updatedNextRegister

						// Compare with true
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: ComparisonOp.EQUAL,
							operand2: result2.operand,
							operand3: 1, // true
							operand4: 0
						})
					} else {
						// Handle comparison condition
						const leftExpr2 = condition2Parts[1].trim()
						const operator2 = condition2Parts[2].trim()
						const rightExpr2 = condition2Parts[3].trim()

						// Parse comparison operator
						const compOp2 = CppParserHelper.parseComparisonOperator(operator2)

						// Process operands
						const leftResult2 = CppParserHelper.processOperand(leftExpr2, variables, nextRegister, instructions)
						nextRegister = leftResult2.updatedNextRegister

						const rightResult2 = CppParserHelper.processOperand(rightExpr2, variables, nextRegister, instructions)
						nextRegister = rightResult2.updatedNextRegister

						// Add comparison instruction
						instructions.push({
							opcode: BytecodeOpCode.COMPARE,
							operand1: compOp2,
							operand2: leftResult2.operand,
							operand3: rightResult2.operand,
							operand4: 0
						})
					}

					// Jump to else block if second condition is also false
					const jumpToElseIndex = instructions.length
					instructions.push({
						opcode: BytecodeOpCode.JUMP_IF_FALSE,
						operand1: 0, // Will be filled later
						operand2: 0,
						operand3: 0,
						operand4: 0
					})

					// Now we're at the else-if body. We need to fix the jumpToElseIfBodyIndex to point here
					const elseIfBodyOffset = (instructions.length - jumpToElseIfBodyIndex) * INSTRUCTION_SIZE
					if (elseIfBodyOffset > MAX_JUMP_DISTANCE) {
						throw new Error(`Jump distance too large (${elseIfBodyOffset} bytes, maximum is ${MAX_JUMP_DISTANCE} bytes)`)
					}
					instructions[jumpToElseIfBodyIndex].operand1 = elseIfBodyOffset & 0xFF
					instructions[jumpToElseIfBodyIndex].operand2 = (elseIfBodyOffset >> 8) & 0xFF

					// Track this block for later
					blockStack.push({
						type: "else-if",
						jumpIndex: jumpToElseIndex
					})
				}
				break
			}

			case CommandType.ELSE_STATEMENT:
				// Mark start of else block
				blockStack.push({ type: "else", jumpIndex: instructions.length })
				break

			case CommandType.DRIVE:
				if (command.matches && command.matches.length === 3) {
					const direction = command.matches[1] // "FORWARD" or "BACKWARD"
					const throttlePercent = parseInt(command.matches[2], 10)
					// Validate throttle percentage
					if (throttlePercent < 0 || throttlePercent > 100) {
						throw new Error(`Invalid throttle percentage: ${throttlePercent}. Must be between 0 and 100.`)
					}

					instructions.push({
						opcode: BytecodeOpCode.MOTOR_DRIVE,
						operand1: direction === "FORWARD" ? 1 : 0, // 1 for forward, 0 for backward
						operand2: throttlePercent,
						operand3: 0,
						operand4: 0
					})
				}
				break

			case CommandType.MOTOR_STOP:
				instructions.push({
					opcode: BytecodeOpCode.MOTOR_STOP,
					operand1: 0,
					operand2: 0,
					operand3: 0,
					operand4: 0
				})
				break

			case CommandType.MOTOR_TURN:
				if (command.matches && command.matches.length === 3) {
					const direction = command.matches[1] // "clockwise" or "counterclockwise"
					const degrees = parseInt(command.matches[2], 10)

					// Validate degrees
					if (degrees < 1 || degrees > 1080) {
						throw new Error(`Invalid degrees: ${degrees}. Must be between 1 and 1080.`)
					}

					instructions.push({
						opcode: BytecodeOpCode.MOTOR_TURN,
						operand1: direction === "CLOCKWISE" ? 1 : 0,
						operand2: degrees,
						operand3: 0,
						operand4: 0
					})
				}
				break

			case CommandType.MOTOR_SPIN:
				if (command.matches && command.matches.length === 3) {
					const direction = command.matches[1] // "CLOCKWISE" or "COUNTERCLOCKWISE"
					const speed = parseInt(command.matches[2], 10)

					// Validate speed percentage
					if (speed < 0 || speed > 100) {
						throw new Error(`Invalid speed: ${speed}. Must be between 0 and 100.`)
					}

					instructions.push({
						opcode: BytecodeOpCode.MOTOR_SPIN,
						operand1: direction === "CLOCKWISE" ? 1 : 0,
						operand2: speed,
						operand3: 0,
						operand4: 0
					})
				}
				break

			case CommandType.DRIVE_TIME:
				if (command.matches && command.matches.length === 4) {
					const direction = command.matches[1] // "FORWARD" or "BACKWARD"
					const seconds = parseFloat(command.matches[2])
					const throttlePercent = parseInt(command.matches[3], 10)

					// Validate parameters
					if (seconds <= 0) {
						throw new Error(`Invalid time value: ${seconds}. Must be greater than 0.`)
					}

					if (throttlePercent < 0 || throttlePercent > 100) {
						throw new Error(`Invalid throttle percentage: ${throttlePercent}. Must be between 0 and 100.`)
					}

					instructions.push({
						opcode: BytecodeOpCode.MOTOR_DRIVE_TIME,
						operand1: direction === "FORWARD" ? 1 : 0, // 1 for forward, 0 for backward
						operand2: seconds,
						operand3: throttlePercent,
						operand4: 0
					})
				}
				break

			case CommandType.DRIVE_DISTANCE:
				if (command.matches && command.matches.length === 4) {
					const direction = command.matches[1] // "FORWARD" or "BACKWARD"
					const inches = parseFloat(command.matches[2])
					const throttlePercent = parseInt(command.matches[3], 10)

					// Validate parameters
					if (inches <= 0 || inches > 240) {
						throw new Error(`Invalid distance value: ${inches}. Must be greater than 0 and less than 240.`)
					}

					if (throttlePercent < 0 || throttlePercent > 100) {
						throw new Error(`Invalid throttle percentage: ${throttlePercent}. Must be between 0 and 100.`)
					}

					instructions.push({
						opcode: BytecodeOpCode.MOTOR_DRIVE_DISTANCE,
						operand1: direction === "FORWARD" ? 1 : 0, // 1 for forward, 0 for backward
						operand2: inches,  // Store distance in inches
						operand3: throttlePercent,
						operand4: 0
					})
				}
				break

			case CommandType.LEFT_DISTANCE_SENSOR: {
				if (command.matches) {
					// Allocate a register for the boolean result
					if (nextRegister >= MAX_REGISTERS) {
						throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
					}
					const boolResultRegister = nextRegister++

					// Since the VM now handles the threshold comparison internally,
					// we only need to read the sensor value which will return a boolean
					instructions.push({
						opcode: BytecodeOpCode.READ_SENSOR,
						operand1: SensorType.SIDE_LEFT_PROXIMITY,
						operand2: boolResultRegister,
						operand3: 0,
						operand4: 0
					})

					// No need for additional comparison or boolean conversion
					// as the VM now returns a boolean directly
				}
				break
			}
			case CommandType.RIGHT_DISTANCE_SENSOR: {
				if (command.matches) {
					// Allocate a register for the boolean result
					if (nextRegister >= MAX_REGISTERS) {
						throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
					}
					const boolResultRegister = nextRegister++

					// Since the VM now handles the threshold comparison internally,
					// we only need to read the sensor value which will return a boolean
					instructions.push({
						opcode: BytecodeOpCode.READ_SENSOR,
						operand1: SensorType.SIDE_RIGHT_PROXIMITY,
						operand2: boolResultRegister,
						operand3: 0,
						operand4: 0
					})

					// No need for additional comparison or boolean conversion
					// as the VM now returns a boolean directly
				}
				break
			}
			case CommandType.FRONT_PROXIMITY_DETECTION: {
				if (command.matches) {
					// Allocate a register for the boolean result
					if (nextRegister >= MAX_REGISTERS) {
						throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
					}
					const boolResultRegister = nextRegister++

					// Use the front proximity sensor type
					const sensorType = SensorType.FRONT_PROXIMITY

					// Read sensor value
					instructions.push({
						opcode: BytecodeOpCode.READ_SENSOR,
						operand1: sensorType,
						operand2: boolResultRegister,
						operand3: 0,
						operand4: 0
					})
				}
				break
			}

			case CommandType.COLOR_SENSOR_READ: {
				if (command.matches && command.matches.length >= 2) {
					// Allocate a register for the boolean result
					if (nextRegister >= MAX_REGISTERS) {
						throw new Error(`Program exceeds maximum register count (${MAX_REGISTERS})`)
					}
					const boolResultRegister = nextRegister++

					// Extract color from the regex match
					const colorName = command.matches[1] // RED, GREEN, BLUE, WHITE, BLACK, YELLOW
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

					// Read sensor value
					instructions.push({
						opcode: BytecodeOpCode.READ_SENSOR,
						operand1: sensorType,
						operand2: boolResultRegister,
						operand3: 0,
						operand4: 0
					})
				}
				break
			}

			case CommandType.WAIT_FOR_BUTTON: {
				instructions.push({
					opcode: BytecodeOpCode.WAIT_FOR_BUTTON,
					operand1: 0,
					operand2: 0,
					operand3: 0,
					operand4: 0
				})
				break
			}

			case CommandType.CHECK_IF_RIGHT_BUTTON_PRESSED: {
				instructions.push({
					opcode: BytecodeOpCode.CHECK_RIGHT_BUTTON_PRESS,
					operand1: 0,
					operand2: 0,
					operand3: 0,
					operand4: 0
				})
				break
			}

			case CommandType.PLAY_TONE: {
				if (command.matches && command.matches.length === 2) {
					const toneName = command.matches[1].replace(/"/g, "").trim()

					// Validate tone name against ToneType enum
					const toneTypeKey = toneName.toUpperCase() as keyof typeof ToneType
					if (!(toneTypeKey in ToneType)) {
						const validTones = Object.keys(ToneType).filter(key => isNaN(Number(key)))
						throw new Error(`Invalid tone name: "${toneName}". Valid tones are: ${validTones.join(", ")}`)
					}

					const toneId = ToneType[toneTypeKey]

					instructions.push({
						opcode: BytecodeOpCode.PLAY_TONE,
						operand1: toneId,
						operand2: 0,
						operand3: 0,
						operand4: 0
					})
				}
				break
			}
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

		if (blockStack.length > 0) {
			throw new Error(`Syntax error: Missing ${blockStack.length} closing brace(s)`)
		}

		return instructions
	}
}
