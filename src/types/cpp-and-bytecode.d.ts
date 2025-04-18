import { CommandType } from "./bytecode-types"

declare global {
	interface BytecodeInstruction {
		opcode: number    // uint32_t in ESP32
		operand1: number  // float in ESP32
		operand2: number  // float in ESP32
		operand3: number  // float in ESP32
		operand4: number  // float in ESP32
	}

	interface BlockStack {
		type: "while" | "if" | "else" | "for"
		jumpIndex: number
		varRegister?: number  // For tracking loop counter register
		startIndex?: number   // For loop start position
	}

	interface PendingJumps {
		index: number
		targetType: string
	}

	interface ValidCommand {
		type: CommandType
		matches: RegExpMatchArray | null
	}

	interface CharacterStack {
		char: string
		pos: number
	}
}

export {}
