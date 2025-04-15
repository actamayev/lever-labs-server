declare global {
	interface BytecodeInstruction {
		opcode: number
		operand1: number
		operand2: number
		operand3: number
		operand4: number
	}

	interface BlockStack {
		type: string
		jumpIndex: number
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
