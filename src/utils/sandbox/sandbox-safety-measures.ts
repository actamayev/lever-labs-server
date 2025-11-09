"use client"

import { isEmpty } from "lodash"
import { BytecodeOpCode } from "../../types/bytecode-types"

export function checkForMotorCommands(bytecode: Float32Array): boolean {
	const motorOpcodes: BytecodeOpCode[] = [
		BytecodeOpCode.MOTOR_DRIVE,
		BytecodeOpCode.MOTOR_STOP,
		BytecodeOpCode.MOTOR_TURN,
		BytecodeOpCode.MOTOR_DRIVE_TIME,
		BytecodeOpCode.MOTOR_DRIVE_DISTANCE,
		BytecodeOpCode.MOTOR_SPIN
	]

	// Each instruction is 5 floats (opcode + 4 operands)
	for (let i = 0; i < bytecode.length; i += 5) {
		const opcode = Math.round(bytecode[i])
		if (motorOpcodes.includes(opcode)) {
			return true
		}
	}
	return false
}

// Helper function to check if first instruction is wait_for_button_press
export function checkForStartButton(bytecode: Float32Array): boolean {
	if (isEmpty(bytecode)) return false

	const firstOpcode = Math.round(bytecode[0])
	return firstOpcode === BytecodeOpCode.WAIT_FOR_BUTTON
}
