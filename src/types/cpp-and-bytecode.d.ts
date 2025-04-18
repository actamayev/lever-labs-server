import { CommandType } from "./bytecode-types"

declare global {
	interface BytecodeInstruction {
		opcode: number    // int16_t in ESP32
		operand1: number  // int16_t in ESP32
		operand2: number  // int16_t in ESP32
		operand3: number  // int16_t in ESP32
		operand4: number  // int16_t in ESP32
	}

	interface BlockStack {
		type: "while" | "if" | "else" | "for"
		jumpIndex: number
		varRegister?: number;  // For tracking loop counter register
		startIndex?: number;   // For loop start position
	}

	interface PendingJumps {
		index: number
		targetType: string
	}

	interface ValidCommand {
		type: CommandType
		matches: RegExpMatchArray | null
	}
}

export {}
