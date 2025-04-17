import { CommandType } from "./bytecode-types"

declare global {
	interface BytecodeInstruction {
		opcode: number
		operand1: number
		operand2: number
		operand3: number
		operand4: number
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
