import { MAX_LED_BRIGHTNESS } from "@/utils/constants/constants"
import { BytecodeOpCode, ComparisonOp } from "../../src/types/bytecode-types"
import { CppParser } from "@/parser/cpp-parser"
import { describe, test, expect } from "@jest/globals"

describe("While Loop Functionality", () => {
	test("should parse basic while(true) loop", () => {
		const code = `while(true) {
		all_leds.set_color(RED);
		wait(0.5);
	}`

		const bytecode = CppParser.cppToByte(code)

		// 1. WHILE_START
		expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[1]).toBe(0)

		// 2. SET_ALL_LEDS (red)
		expect(bytecode[5]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[6]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[7]).toBe(0)   // G
		expect(bytecode[8]).toBe(0)   // B

		// 3. WAIT
		expect(bytecode[10]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[11]).toBe(0.5)

		// 4. WHILE_END (jump back 3 instructions: 3 * 20 = 60 bytes)
		expect(bytecode[15]).toBe(BytecodeOpCode.WHILE_END)
		expect(bytecode[16]).toBe(60)

		// Last instruction: END
		const lastIndex = bytecode.length - 5
		expect(bytecode[lastIndex]).toBe(BytecodeOpCode.END)
		expect(bytecode[lastIndex + 1]).toBe(0)
	})

	test("should handle nested while loops", () => {
		const code = `while(true) {
		all_leds.set_color(RED);
		while(true) {
			all_leds.set_color(BLUE);
			wait(0.1);
		}
		wait(0.5);
	}`

		const bytecode = CppParser.cppToByte(code)

		// Find WHILE_START indices
		const whileStartIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_START) {
				whileStartIndices.push(i)
			}
		}
		expect(whileStartIndices.length).toBe(2)

		// Find WHILE_END indices
		const whileEndIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndices.push(i)
			}
		}
		expect(whileEndIndices.length).toBe(2)
		expect(whileEndIndices[0]).toBeLessThan(whileEndIndices[1])

		// Check inner loop jump (3 instructions back: 3 * 20 = 60 bytes)
		const innerJumpOffset = bytecode[whileEndIndices[0] + 1]
		const expectedInnerOffset = (whileEndIndices[0] - whileStartIndices[1]) / 5 * 20
		expect(innerJumpOffset).toBe(expectedInnerOffset)

		// Check outer loop jump
		const outerJumpOffset = bytecode[whileEndIndices[1] + 1]
		const expectedOuterOffset = (whileEndIndices[1] - whileStartIndices[0]) / 5 * 20
		expect(outerJumpOffset).toBe(expectedOuterOffset)
	})

	test("should handle loops with conditionals", () => {
		const code = `while(true) {
			if (10 > 5) {
				all_leds.set_color(GREEN);
			} else {
				all_leds.set_color(RED);
			}
			wait(1);
		}`

		const bytecode = CppParser.cppToByte(code)

		// 1. WHILE_START
		expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[1]).toBe(0)

		// 2. COMPARE
		expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[6]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[7]).toBe(10)
		expect(bytecode[8]).toBe(5)

		// 3. JUMP_IF_FALSE to else branch (3 instructions ahead: 3 * 20 = 60 bytes)
		expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[11]).toBe(60)

		// 4. SET_ALL_LEDS (green)
		expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[16]).toBe(0)   // R
		expect(bytecode[17]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[18]).toBe(0)   // B

		// 5. JUMP to skip else branch (2 instructions ahead: 2 * 20 = 40 bytes)
		expect(bytecode[20]).toBe(BytecodeOpCode.JUMP)
		expect(bytecode[21]).toBe(40)

		// 6. SET_ALL_LEDS (red)
		expect(bytecode[25]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[26]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[27]).toBe(0)   // G
		expect(bytecode[28]).toBe(0)   // B

		// 7. WAIT
		expect(bytecode[30]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[31]).toBe(1)

		// 8. WHILE_END (jump back 7 instructions: 7 * 20 = 140 bytes)
		expect(bytecode[35]).toBe(BytecodeOpCode.WHILE_END)
		expect(bytecode[36]).toBe(140)

		// 9. END
		expect(bytecode[40]).toBe(BytecodeOpCode.END)
	})

	test("should handle multiple loops in sequence", () => {
		const code = `
		while(true) {
			all_leds.set_color(RED);
			wait(0.1);
		}
		while(true) {
			all_leds.set_color(BLUE);
			wait(0.2);
		}`

		const bytecode = CppParser.cppToByte(code)

		const whileStartIndices: number[] = []
		const whileEndIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_START) {
				whileStartIndices.push(i)
			} else if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndices.push(i)
			}
		}
		expect(whileStartIndices.length).toBe(2)
		expect(whileEndIndices.length).toBe(2)

		// Check first loop jump (3 instructions back: 3 * 20 = 60 bytes)
		const firstJumpOffset = bytecode[whileEndIndices[0] + 1]
		const expectedFirstOffset = (whileEndIndices[0] - whileStartIndices[0]) / 5 * 20
		expect(firstJumpOffset).toBe(expectedFirstOffset)

		// Check second loop jump
		const secondJumpOffset = bytecode[whileEndIndices[1] + 1]
		const expectedSecondOffset = (whileEndIndices[1] - whileStartIndices[1]) / 5 * 20
		expect(secondJumpOffset).toBe(expectedSecondOffset)
	})

	test("should handle empty while loop", () => {
		const code = `while(true) {
		// Empty loop
	}`

		const bytecode = CppParser.cppToByte(code)

		expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[1]).toBe(0)
		expect(bytecode[5]).toBe(BytecodeOpCode.WHILE_END)
		expect(bytecode[6]).toBe(20) // Jump back 1 instruction (20 bytes)
		expect(bytecode[7]).toBe(0)
		expect(bytecode[8]).toBe(0)
		expect(bytecode[9]).toBe(0)
		expect(bytecode[10]).toBe(BytecodeOpCode.END)
		expect(bytecode.length).toBe(15)
	})

	test("should handle while loop at the end of program", () => {
		const code = `
			all_leds.set_color(GREEN);
			wait(2);
			while(true) {
				all_leds.set_color(BLUE);
			}
		`

		const bytecode = CppParser.cppToByte(code)

		// 1. SET_ALL_LEDS (green)
		expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[1]).toBe(0)   // R
		expect(bytecode[2]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[3]).toBe(0)   // B

		// 2. WAIT
		expect(bytecode[5]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[6]).toBe(2)

		// 3. WHILE_START
		expect(bytecode[10]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[11]).toBe(0)

		// 4. SET_ALL_LEDS (blue)
		expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[16]).toBe(0)   // R
		expect(bytecode[17]).toBe(0)   // G
		expect(bytecode[18]).toBe(MAX_LED_BRIGHTNESS) // B

		// 5. WHILE_END (jump back 2 instructions: 2 * 20 = 40 bytes)
		expect(bytecode[20]).toBe(BytecodeOpCode.WHILE_END)
		expect(bytecode[21]).toBe(40)

		// 6. END
		expect(bytecode[25]).toBe(BytecodeOpCode.END)
		expect(bytecode[26]).toBe(0)
	})
})

describe("For Loop Functionality", () => {
	test("should parse basic for loop", () => {
		const code = `for (int i = 0; i < 5; i++) {
		all_leds.set_color(RED);
		wait(0.1);
	}`

		const bytecode = CppParser.cppToByte(code)

		// 1. FOR_INIT
		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[1]).toBe(0) // Register
		expect(bytecode[2]).toBe(0) // Init value
		expect(bytecode[3]).toBe(0) // Unused

		// 2. FOR_CONDITION
		expect(bytecode[5]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[6]).toBe(0) // Register
		expect(bytecode[7]).toBe(5) // End value
		expect(bytecode[8]).toBe(0) // Unused

		// 3. JUMP_IF_FALSE (5 instructions ahead: 5 * 20 = 100 bytes)
		expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[11]).toBe(100)

		// 4. SET_ALL_LEDS (red)
		expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[16]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[17]).toBe(0)   // G
		expect(bytecode[18]).toBe(0)   // B

		// 5. WAIT
		expect(bytecode[20]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[21]).toBeCloseTo(0.1)

		// 6. FOR_INCREMENT
		expect(bytecode[25]).toBe(BytecodeOpCode.FOR_INCREMENT)
		expect(bytecode[26]).toBe(0) // Register

		// 7. JUMP_BACKWARD (5 instructions back: 5 * 20 = 100 bytes)
		expect(bytecode[30]).toBe(BytecodeOpCode.JUMP_BACKWARD)
		expect(bytecode[31]).toBe(100)

		// Last: END
		const lastIndex = bytecode.length - 5
		expect(bytecode[lastIndex]).toBe(BytecodeOpCode.END)
	})

	test("should handle empty for loop", () => {
		const code = `for (int i = 0; i < 10; i++) {
		// Empty loop
	}`

		const bytecode = CppParser.cppToByte(code)

		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[5]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[15]).toBe(BytecodeOpCode.FOR_INCREMENT)
		expect(bytecode[20]).toBe(BytecodeOpCode.JUMP_BACKWARD)
		expect(bytecode[25]).toBe(BytecodeOpCode.END)
	})

	test("should handle for loop with non-zero start value", () => {
		const code = `for (int j = 3; j < 8; j++) {
		all_leds.set_color(BLUE);
	}`

		const bytecode = CppParser.cppToByte(code)

		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[2]).toBe(3) // Start value
		expect(bytecode[5]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[7]).toBe(8) // End value
	})

	test("should handle multiple for loops in sequence", () => {
		const code = `for (int i = 0; i < 3; i++) {
		all_leds.set_color(RED);
	}
	for (int j = 0; j < 2; j++) {
		all_leds.set_color(BLUE);
	}`

		const bytecode = CppParser.cppToByte(code)

		const forInitIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(forInitIndices.length).toBe(2)
		expect(bytecode[forInitIndices[0] + 1]).toBe(0) // Register 0
		expect(bytecode[forInitIndices[1] + 1]).toBe(1) // Register 1

		const jumpBackwardIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.JUMP_BACKWARD) {
				jumpBackwardIndices.push(i)
			}
		}
		expect(jumpBackwardIndices.length).toBe(2)
	})

	test("should handle nested for loops", () => {
		const code = `for (int i = 0; i < 3; i++) {
		all_leds.set_color(RED);
		for (int j = 0; j < 2; j++) {
			all_leds.set_color(BLUE);
		}
	}`

		const bytecode = CppParser.cppToByte(code)

		const forInitIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(forInitIndices.length).toBe(2)
		expect(bytecode[forInitIndices[0] + 1]).toBe(0)
		expect(bytecode[forInitIndices[1] + 1]).toBe(1)

		const forIncrementIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
				forIncrementIndices.push(i)
			}
		}
		expect(forIncrementIndices.length).toBe(2)
		expect(bytecode[forIncrementIndices[0] + 1]).toBe(1)
		expect(bytecode[forIncrementIndices[1] + 1]).toBe(0)
	})

	test("should handle for loop with conditional inside", () => {
		const code = `for (int i = 0; i < 5; i++) {
			if (2 > 1) {
				all_leds.set_color(GREEN);
			} else {
				all_leds.set_color(RED);
			}
		}`

		const bytecode = CppParser.cppToByte(code)

		// 1. FOR_INIT (i = 0)
		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[1]).toBe(0) // Register
		expect(bytecode[2]).toBe(0) // Initial value

		// 2. FOR_CONDITION (i < 5)
		expect(bytecode[5]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[6]).toBe(0) // Register
		expect(bytecode[7]).toBe(5) // End value

		// 3. JUMP_IF_FALSE (exit loop, 8 instructions ahead: 8 * 20 = 160 bytes)
		expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[11]).toBe(160)

		// 4. COMPARE (2 > 1)
		expect(bytecode[15]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[16]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[17]).toBe(2)
		expect(bytecode[18]).toBe(1)

		// 5. JUMP_IF_FALSE (to else branch, 3 instructions ahead: 3 * 20 = 60 bytes)
		expect(bytecode[20]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[21]).toBe(60)

		// 6. SET_ALL_LEDS (green)
		expect(bytecode[25]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[26]).toBe(0)   // R
		expect(bytecode[27]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[28]).toBe(0)   // B

		// 7. JUMP (skip else branch, 2 instructions ahead: 2 * 20 = 40 bytes)
		expect(bytecode[30]).toBe(BytecodeOpCode.JUMP)
		expect(bytecode[31]).toBe(40)

		// 8. SET_ALL_LEDS (red)
		expect(bytecode[35]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[36]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[37]).toBe(0)   // G
		expect(bytecode[38]).toBe(0)   // B

		// 9. FOR_INCREMENT
		expect(bytecode[40]).toBe(BytecodeOpCode.FOR_INCREMENT)
		expect(bytecode[41]).toBe(0) // Register

		// 10. JUMP_BACKWARD (to FOR_CONDITION, 8 instructions back: 8 * 20 = 160 bytes)
		expect(bytecode[45]).toBe(BytecodeOpCode.JUMP_BACKWARD)
		expect(bytecode[46]).toBe(160)

		// 11. END
		expect(bytecode[50]).toBe(BytecodeOpCode.END)
		expect(bytecode[51]).toBe(0)
	})

	test("should handle complex for loop pattern with multiple operations", () => {
		const code = `for (int i = 1; i < 4; i++) {
		all_leds.set_color(WHITE);
		wait(0.1);
		all_leds.set_color(BLUE);
		wait(0.1);
		all_leds.set_color(RED);
		wait(0.1);
	}`

		const bytecode = CppParser.cppToByte(code)

		let waitCount = 0
		let setLedCount = 0
		for (let i = 15; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WAIT) {
				waitCount++
			} else if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
				setLedCount++
			}
			if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
				break
			}
		}
		expect(waitCount).toBe(3)
		expect(setLedCount).toBe(3)

		let foundIncrement = false
		let foundJump = false
		for (let i = bytecode.length - 15; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
				foundIncrement = true
			} else if (bytecode[i] === BytecodeOpCode.JUMP_BACKWARD && foundIncrement) {
				foundJump = true
				break
			}
		}
		expect(foundIncrement).toBe(true)
		expect(foundJump).toBe(true)
	})

	test("should handle for loop with variable reuse", () => {
		const code = `for (int i = 0; i < 2; i++) {
		all_leds.set_color(RED);
	}
	for (int i = 0; i < 3; i++) {
		all_leds.set_color(BLUE);
	}`

		const bytecode = CppParser.cppToByte(code)

		const forInitIndices: number[] = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(bytecode[forInitIndices[0] + 1]).not.toBe(bytecode[forInitIndices[1] + 1])
	})
})
