declare global {
	interface BytecodeInstruction {
		opcode: number
		operand1: number
		operand2: number
		operand3: number
		operand4: number
	}
}

export {}
