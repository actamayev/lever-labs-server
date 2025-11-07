import { CommandType, VarType } from "./bytecode-types"

export interface BytecodeInstruction {
	opcode: number    // uint32_t in ESP32
	operand1: number  // float in ESP32
	operand2: number  // float in ESP32
	operand3: number  // float in ESP32
	operand4: number  // float in ESP32
}

export interface BlockStack {
	type: "for" | "while" | "if" | "else-if" | "else"
	jumpIndex: number
	varRegister?: number // For for loops
	startIndex?: number // For for loops
	additionalJumps?: number[] // For compound conditions
}

export interface PendingJumps {
	index: number
	targetType: "end_of_else" | "end_of_chain"
}

export interface ValidCommand {
	type: CommandType
	matches: RegExpMatchArray | null
}

export interface CharacterStack {
	char: string
	pos: number
}

export interface VariableType {
	type: VarType
	register: number
}
