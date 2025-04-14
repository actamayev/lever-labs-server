import { MAX_LED_BRIGHTNESS } from "../utils/constants"
import { BytecodeOpCode, CommandPatterns, CommandType, LedID } from "../utils/cpp/bytecode-types"

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

		// Split code into statements
		const statements = cppCode.split(";").map(s => s.trim()).filter(s => s.length > 0)

		for (const statement of statements) {
			const command = this.identifyCommand(statement)

			if (!command) {
				throw new Error(`Invalid command: "${statement}"`)
			}

			switch (command.type) {
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
}
