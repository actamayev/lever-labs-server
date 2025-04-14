/* eslint-disable max-depth */
import { MAX_LED_BRIGHTNESS } from "../utils/constants"
import { BytecodeOpCode, CommandPatterns, CommandType, LedID, VarType } from "../utils/cpp/bytecode-types"

export default class CppParser {
	public static cppToByte(unsanitizedCpp: string): Uint8Array<ArrayBufferLike> {
		const sanitizedCode = this.sanitizeUserCode(unsanitizedCpp)
		const instructions = this.parseCppCode(sanitizedCode)
		const bytecode = this.generateBytecode(instructions)

		return bytecode
	}

	private static identifyCommand(statement: string): { type: CommandType, matches: RegExpMatchArray | null } | null {
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

		// Split code into statements
		const statements = cppCode.split(";").map(s => s.trim()).filter(s => s.length > 0)

		for (const statement of statements) {
			const command = this.identifyCommand(statement)

			// console.log(command)
			if (!command) {
				throw new Error(`Invalid command: "${statement}"`)
			}

			switch (command.type) {
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
		return userCode
			.trim()
		// Remove single-line comments
			.replace(/\/\/.*$/gm, "")
		// Remove multi-line comments
			.replace(/\/\*[\s\S]*?\*\//g, "")
		// Normalize whitespace
			.replace(/\s+/g, " ")
		// Escape single quotes
			.replace(/'/g, "'\\''")
	}

	private static floatToBytes(value: number): Uint8Array {
		const buffer = new ArrayBuffer(4)
		const view = new DataView(buffer)
		view.setFloat32(0, value, true) // little-endian
		return new Uint8Array(buffer)
	}
}
