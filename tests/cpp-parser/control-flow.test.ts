import { CppParser } from "../../src/parser/cpp-parser"
import { BytecodeOpCode, ComparisonOp, SensorType } from "../../src/types/bytecode-types"
import { MAX_LED_BRIGHTNESS } from "../../src/utils/constants/constants"
import { describe, test, expect } from "@jest/globals"

describe("Control flow", () => {
	test("should parse basic if-else statement", () => {
		const code = `
		if (5 > 10) {
			all_leds.set_color(WHITE);
		} else {
			all_leds.set_color(RED);
		}
		wait(1);
		all_leds.set_color(GREEN);
	`

		const bytecode = CppParser.cppToByte(code)

		// 1. Compare operation
		expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[2]).toBe(5)  // Left value
		expect(bytecode[3]).toBe(10) // Right value
		expect(bytecode[4]).toBe(0)  // Unused

		// 2. Jump if false to else block (3 instructions ahead: 3 * 20 = 60 bytes)
		expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[6]).toBe(60)

		// 3. Set LEDs white (true branch)
		expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[11]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[12]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[13]).toBe(MAX_LED_BRIGHTNESS) // B

		// 4. Unconditional jump to skip else block (5 instructions ahead: 5 * 20 = 100 bytes)
		expect(bytecode[15]).toBe(BytecodeOpCode.JUMP)
		expect(bytecode[16]).toBe(40)

		// 5. Set LEDs red (false branch)
		expect(bytecode[20]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[21]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[22]).toBe(0)   // G
		expect(bytecode[23]).toBe(0)   // B

		// 6. Wait instruction
		expect(bytecode[25]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[26]).toBe(1) // 1s

		// 7. Set LEDs green
		expect(bytecode[30]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[31]).toBe(0)   // R
		expect(bytecode[32]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[33]).toBe(0)   // B

		// 8. End instruction
		expect(bytecode[35]).toBe(BytecodeOpCode.END)
		expect(bytecode[36]).toBe(0)
	})

	test("should parse if without else", () => {
		const code = `if (3 < 7) {
	all_leds.set_color(BLUE);
}
all_leds.set_color(PURPLE);`

		const bytecode = CppParser.cppToByte(code)

		// 1. Compare operation
		expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[1]).toBe(ComparisonOp.LESS_THAN)
		expect(bytecode[2]).toBe(3)
		expect(bytecode[3]).toBe(7)
		expect(bytecode[4]).toBe(0)

		// 2. Jump if false to skip if block (2 instructions ahead: 2 * 20 = 40 bytes)
		expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[6]).toBe(40)

		// 3. Set LEDs blue
		expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[11]).toBe(0)   // R
		expect(bytecode[12]).toBe(0)   // G
		expect(bytecode[13]).toBe(MAX_LED_BRIGHTNESS) // B

		// 4. Set LEDs purple
		expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[16]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[17]).toBe(0)   // G
		expect(bytecode[18]).toBe(MAX_LED_BRIGHTNESS) // B

		// 5. End instruction
		const endIndex = bytecode.length - 5
		expect(bytecode[endIndex]).toBe(BytecodeOpCode.END)
		expect(bytecode[endIndex + 1]).toBe(0)
	})

	test("should parse nested if-else statements", () => {
		const code = `if (10 == 10) {
	if (5 != 5) {
		all_leds.set_color(GREEN);
	} else {
		all_leds.set_color(BLUE);
	}
} else {
	all_leds.set_color(RED);
}`

		const bytecode = CppParser.cppToByte(code)

		// 1. First compare operation (outer if)
		expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[1]).toBe(ComparisonOp.EQUAL)
		expect(bytecode[2]).toBe(10)
		expect(bytecode[3]).toBe(10)
		expect(bytecode[4]).toBe(0)

		// 2. Jump if false to outer else (7 instructions ahead: 7 * 20 = 140 bytes)
		expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[6]).toBe(140)

		// 3. Second compare operation (inner if)
		expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[11]).toBe(ComparisonOp.NOT_EQUAL)
		expect(bytecode[12]).toBe(5)
		expect(bytecode[13]).toBe(5)
		expect(bytecode[14]).toBe(0)

		// Verify end instruction
		expect(bytecode[bytecode.length - 5]).toBe(BytecodeOpCode.END)
		expect(bytecode[bytecode.length - 4]).toBe(0)
	})

	test("should parse equality and inequality operators", () => {
		const tests = [
			{ code: "if (5 == 5) { all_leds.set_color(RED); }", op: ComparisonOp.EQUAL },
			{ code: "if (5 != 5) { all_leds.set_color(RED); }", op: ComparisonOp.NOT_EQUAL },
			{ code: "if (5 > 5) { all_leds.set_color(RED); }", op: ComparisonOp.GREATER_THAN },
			{ code: "if (5 < 5) { all_leds.set_color(RED); }", op: ComparisonOp.LESS_THAN },
			{ code: "if (5 >= 5) { all_leds.set_color(RED); }", op: ComparisonOp.GREATER_EQUAL },
			{ code: "if (5 <= 5) { all_leds.set_color(RED); }", op: ComparisonOp.LESS_EQUAL }
		]

		for (const singleOperatorTest of tests) {
			const bytecode = CppParser.cppToByte(singleOperatorTest.code)

			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(singleOperatorTest.op)
			expect(bytecode[2]).toBe(5)
			expect(bytecode[3]).toBe(5)
			expect(bytecode[4]).toBe(0)
		}
	})

	describe("Control flow error handling", () => {
		test("should reject unsupported comparison operator", () => {
			expect(() => {
				CppParser.cppToByte("if (5 = 10) { all_leds.set_color(RED); }")
			}).toThrow(/Unsupported operator/)
		})

		test("should reject invalid command for malformed if statement", () => {
			expect(() => {
				CppParser.cppToByte("if (5 <> 10) { all_leds.set_color(RED); }")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Complex Sensor Usage", () => {
		test("should handle sensors in if-else branches", () => {
			const code = `if (imu.getPitch() > 20) {
			all_leds.set_color(RED);
		} else {
			if (imu.getRoll() < -10) {
				all_leds.set_color(BLUE);
			} else {
				all_leds.set_color(GREEN);
			}
		}`

			const bytecode = CppParser.cppToByte(code)

			// 1. READ_SENSOR (Pitch)
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.PITCH)
			expect(bytecode[2]).toBe(0) // Register

			// 2. COMPARE (Pitch > 20)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[7]).toBe(32768) // Register reference (0x8000)
			expect(bytecode[8]).toBe(20)

			// 3. JUMP_IF_FALSE (to outer else, 3 instructions ahead: 3 * 20 = 60 bytes)
			expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
			expect(bytecode[11]).toBe(60)

			// 4. SET_ALL_LEDS (red)
			expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[16]).toBe(MAX_LED_BRIGHTNESS) // R
			expect(bytecode[17]).toBe(0)   // G
			expect(bytecode[18]).toBe(0)   // B

			// 5. JUMP (skip inner if-else, 7 instructions ahead: 7 * 20 = 140 bytes)
			expect(bytecode[20]).toBe(BytecodeOpCode.JUMP)
			expect(bytecode[21]).toBe(140)

			// 6. READ_SENSOR (Roll)
			expect(bytecode[25]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[26]).toBe(SensorType.ROLL)
			expect(bytecode[27]).toBe(1) // Register

			// 7. COMPARE (Roll < -10)
			expect(bytecode[30]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[31]).toBe(ComparisonOp.LESS_THAN)
			expect(bytecode[32]).toBe(32769) // Register reference (0x8000 | 1)
			expect(bytecode[33]).toBe(-10)

			// 8. JUMP_IF_FALSE (to inner else, 3 instructions ahead: 3 * 20 = 60 bytes)
			expect(bytecode[35]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
			expect(bytecode[36]).toBe(60)

			// 9. SET_ALL_LEDS (blue)
			expect(bytecode[40]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[41]).toBe(0)   // R
			expect(bytecode[42]).toBe(0)   // G
			expect(bytecode[43]).toBe(MAX_LED_BRIGHTNESS) // B

			// 10. JUMP (skip inner else, 2 instructions ahead: 2 * 20 = 40 bytes)
			expect(bytecode[45]).toBe(BytecodeOpCode.JUMP)
			expect(bytecode[46]).toBe(40)

			// 11. SET_ALL_LEDS (green)
			expect(bytecode[50]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[51]).toBe(0)   // R
			expect(bytecode[52]).toBe(MAX_LED_BRIGHTNESS) // G
			expect(bytecode[53]).toBe(0)   // B

			// 12. END
			expect(bytecode[55]).toBe(BytecodeOpCode.END)
			expect(bytecode[56]).toBe(0)
		})

		test("should handle sensors in loops", () => {
			const code = `while (true) {
		if (imu.getAccelMagnitude() > 5) {
			all_leds.set_color(WHITE);
		}
		wait(0.1);
	}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
			expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[6]).toBe(SensorType.ACCEL_MAG)
		})

		test("should handle sensors in for loops", () => {
			const code = `for (int i = 0; i < 10; i++) {
		if (imu.getYaw() > i) {
			all_leds.set_color(RED);
		}
	}`

			const bytecode = CppParser.cppToByte(code)

			let sensorIndex = -1
			for (let i = 15; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR && bytecode[i + 1] === SensorType.YAW) {
					sensorIndex = i
					break
				}
			}
			expect(sensorIndex).toBeGreaterThan(0)
		})
	})
})

describe("Bidirectional Comparisons", () => {
	test("should handle variables on left side of comparison", () => {
		const bytecode = CppParser.cppToByte(`
	float myFloat = 10.5;
	if (myFloat > 0) {
	all_leds.set_color(RED);
	} else {
	all_leds.set_color(GREEN);
	}
`)

		// Find COMPARE instruction
		let compareIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareIndex = i
				break
			}
		}

		expect(compareIndex).toBeGreaterThan(0)
		expect(bytecode[compareIndex + 1]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[compareIndex + 2]).toBe(0x8000) // Register reference (high bit set)
		expect(bytecode[compareIndex + 3]).toBe(0)      // Constant 0
	})

	test("should handle variables on right side of comparison", () => {
		const code = `float myFloat = 10.5;
			if (0 < myFloat) {
			all_leds.set_color(RED);
			} else {
			all_leds.set_color(GREEN);
			}`
		const bytecode = CppParser.cppToByte(code)

		// Find COMPARE instruction
		let compareIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareIndex = i
				break
			}
		}

		expect(compareIndex).toBeGreaterThan(0)
		expect(bytecode[compareIndex + 1]).toBe(ComparisonOp.LESS_THAN)
		expect(bytecode[compareIndex + 2]).toBe(0)      // Constant 0
		expect(bytecode[compareIndex + 3]).toBe(0x8000) // Register reference (high bit set)
	})

	test("should handle sensor expressions on right side of comparison", () => {
		const code = `
			while(true) {
				if (0 > imu.getPitch()) {
					all_leds.set_color(RED);
				} else {
					all_leds.set_color(GREEN);
				}
			}
		`
		const bytecode = CppParser.cppToByte(code)

		// Find READ_SENSOR instruction
		let sensorIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
				sensorIndex = i
				break
			}
		}
		expect(sensorIndex).toBeGreaterThan(0)

		// Find COMPARE instruction
		let compareIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareIndex = i
				break
			}
		}
		expect(compareIndex).toBeGreaterThan(0)

		expect(bytecode[compareIndex + 1]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[compareIndex + 2]).toBe(0)      // Constant 0
		expect(bytecode[compareIndex + 3] & 0x8000).toBe(0x8000) // Register reference (high bit set)
	})

	test("should produce equivalent bytecode for equivalent comparisons", () => {
		// Method 1: variable on left
		const bytecode1 = CppParser.cppToByte(`
	while(true) {
		float pitch = imu.getPitch();
		if (pitch < 0) {
			all_leds.set_color(RED);
		} else {
			all_leds.set_color(GREEN);
		}
	}
	`)

		// Method 2: variable on right
		const bytecode2 = CppParser.cppToByte(`
	while(true) {
		float pitch = imu.getPitch();
		if (0 > pitch) {
			all_leds.set_color(RED);
		} else {
			all_leds.set_color(GREEN);
		}
	}
	`)

		// Both should have the same pattern of instructions
		let compareIndex1 = -1
		let compareIndex2 = -1

		for (let i = 0; i < bytecode1.length; i += 5) {
			if (bytecode1[i] === BytecodeOpCode.COMPARE) {
				compareIndex1 = i
				break
			}
		}

		for (let i = 0; i < bytecode2.length; i += 5) {
			if (bytecode2[i] === BytecodeOpCode.COMPARE) {
				compareIndex2 = i
				break
			}
		}

		expect(compareIndex1).toBeGreaterThan(0)
		expect(compareIndex2).toBeGreaterThan(0)

		// Check that the comparison operations are equivalent
		// Method 1: pitch < 0 (LESS_THAN)
		// Method 2: 0 > pitch (GREATER_THAN)
		expect(bytecode1[compareIndex1 + 1]).toBe(ComparisonOp.LESS_THAN)
		expect(bytecode2[compareIndex2 + 1]).toBe(ComparisonOp.GREATER_THAN)

		// Check operands are swapped appropriately
		// Method 1: operand2=register, operand3=0
		// Method 2: operand2=0, operand3=register
		expect(bytecode1[compareIndex1 + 2] & 0x8000).toBe(0x8000) // Register in left operand
		expect(bytecode1[compareIndex1 + 3]).toBe(0)               // Constant in right operand

		expect(bytecode2[compareIndex2 + 2]).toBe(0)               // Constant in left operand
		expect(bytecode2[compareIndex2 + 3] & 0x8000).toBe(0x8000) // Register in right operand
	})

	test("should handle variables on both sides of comparison", () => {
		const bytecode = CppParser.cppToByte(`
	while(true) {
		float var1 = 5.0;
		float var2 = 10.0;
		if (var1 < var2) {
			all_leds.set_color(RED);
		}
	}
	`)

		// Find COMPARE instruction
		let compareIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareIndex = i
				break
			}
		}

		expect(compareIndex).toBeGreaterThan(0)
		expect(bytecode[compareIndex + 1]).toBe(ComparisonOp.LESS_THAN)
		expect(bytecode[compareIndex + 2] & 0x8000).toBe(0x8000) // Register reference (high bit set)
		expect(bytecode[compareIndex + 3] & 0x8000).toBe(0x8000) // Register reference (high bit set)
		// The registers should be different
		expect(bytecode[compareIndex + 2]).not.toBe(bytecode[compareIndex + 3])
	})

	test("should handle sensor expressions on both sides of comparison", () => {
		const bytecode = CppParser.cppToByte(`
	while(true) {
		if (imu.getPitch() > imu.getRoll()) {
			all_leds.set_color(BLUE);
		}
	}
	`)

		// Should have two READ_SENSOR instructions
		let sensorCount = 0
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
				sensorCount++
			}
		}
		expect(sensorCount).toBe(2)

		// Find COMPARE instruction
		let compareIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareIndex = i
				break
			}
		}

		expect(compareIndex).toBeGreaterThan(0)
		expect(bytecode[compareIndex + 1]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[compareIndex + 2] & 0x8000).toBe(0x8000) // Register reference (high bit set)
		expect(bytecode[compareIndex + 3] & 0x8000).toBe(0x8000) // Register reference (high bit set)
		// The registers should be different
		expect(bytecode[compareIndex + 2]).not.toBe(bytecode[compareIndex + 3])
	})

	// Add this test to control-flow.test.ts inside the "Control flow" describe block

	describe("Comparison Operators", () => {
		test("should handle all comparison operators correctly", () => {
			// Test all comparison operators
			const operatorTests = [
				{ code: "if (5 > 3) { all_leds.set_color(RED); }", op: ComparisonOp.GREATER_THAN },
				{ code: "if (3 < 5) { all_leds.set_color(RED); }", op: ComparisonOp.LESS_THAN },
				{ code: "if (5 >= 5) { all_leds.set_color(RED); }", op: ComparisonOp.GREATER_EQUAL },
				{ code: "if (5 <= 5) { all_leds.set_color(RED); }", op: ComparisonOp.LESS_EQUAL },
				{ code: "if (5 == 5) { all_leds.set_color(RED); }", op: ComparisonOp.EQUAL },
				{ code: "if (5 != 6) { all_leds.set_color(RED); }", op: ComparisonOp.NOT_EQUAL }
			]

			for (const singleOperatorTest of operatorTests) {
				const bytecode = CppParser.cppToByte(singleOperatorTest.code)
				// Verify correct operator enum is used
				expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
				expect(bytecode[1]).toBe(singleOperatorTest.op)
			}
		})

		test("should call parseComparisonOperator for all operators in compound conditions", () => {
			// Testing compound AND condition
			const andCode = "if ((5 >= 3) && (10 <= 15)) { all_leds.set_color(RED); }"
			const andBytecode = CppParser.cppToByte(andCode)

			// Find COMPARE instructions
			let foundGreaterEqual = false
			let foundLessEqual = false

			for (let i = 0; i < andBytecode.length; i += 5) {
				if (andBytecode[i] === BytecodeOpCode.COMPARE) {
					if (andBytecode[i + 1] === ComparisonOp.GREATER_EQUAL) {
						foundGreaterEqual = true
					} else if (andBytecode[i + 1] === ComparisonOp.LESS_EQUAL) {
						foundLessEqual = true
					}
				}
			}

			expect(foundGreaterEqual).toBe(true)
			expect(foundLessEqual).toBe(true)

			// Testing compound OR condition
			const orCode = "if ((5 == 5) || (10 != 15)) { all_leds.set_color(RED); }"
			const orBytecode = CppParser.cppToByte(orCode)

			// Find COMPARE instructions
			let foundEqual = false
			let foundNotEqual = false

			for (let i = 0; i < orBytecode.length; i += 5) {
				if (orBytecode[i] === BytecodeOpCode.COMPARE) {
					if (orBytecode[i + 1] === ComparisonOp.EQUAL) {
						foundEqual = true
					} else if (orBytecode[i + 1] === ComparisonOp.NOT_EQUAL) {
						foundNotEqual = true
					}
				}
			}

			expect(foundEqual).toBe(true)
			expect(foundNotEqual).toBe(true)
		})
	})

	describe("Compound Conditions with Simple Expressions", () => {
		describe("AND Operator with Simple Conditions", () => {
			test("should handle compound AND with boolean variables", () => {
				const code = `
        bool a = true;
        bool b = true;
        if ((a) && (b)) {
          all_leds.set_color(RED);
        }
      `

				const bytecode = CppParser.cppToByte(code)

				// Check that we have variable declarations and assignments
				let declareVarCount = 0
				let setVarCount = 0

				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
						declareVarCount++
					} else if (bytecode[i] === BytecodeOpCode.SET_VAR) {
						setVarCount++
					}
				}

				expect(declareVarCount).toBe(2) // Two boolean variables
				expect(setVarCount).toBe(2)     // Two SET_VAR instructions

				// Find the first COMPARE instruction (for first boolean variable)
				let firstCompareIndex = -1
				for (let i = 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						firstCompareIndex = i
						break
					}
				}
				expect(firstCompareIndex).toBeGreaterThan(0)

				// Should be comparing with true (1)
				expect(bytecode[firstCompareIndex + 1]).toBe(ComparisonOp.EQUAL)
				expect(bytecode[firstCompareIndex + 3]).toBe(1) // Comparing with true

				// Should have JUMP_IF_FALSE after first comparison (short-circuit)
				expect(bytecode[firstCompareIndex + 5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

				// Find the second COMPARE instruction
				let secondCompareIndex = -1
				for (let i = firstCompareIndex + 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						secondCompareIndex = i
						break
					}
				}
				expect(secondCompareIndex).toBeGreaterThan(firstCompareIndex)

				// Should be comparing with true (1)
				expect(bytecode[secondCompareIndex + 1]).toBe(ComparisonOp.EQUAL)
				expect(bytecode[secondCompareIndex + 3]).toBe(1) // Comparing with true

				// Should find red LED instruction somewhere after the comparisons
				let redLedFound = false
				for (let i = secondCompareIndex; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
            bytecode[i + 1] === MAX_LED_BRIGHTNESS &&
            bytecode[i + 2] === 0 &&
            bytecode[i + 3] === 0) {
						redLedFound = true
						break
					}
				}
				expect(redLedFound).toBe(true)
			})

			test("should handle compound AND with proximity sensor functions", () => {
				const code = `
        if ((front_distance_sensor.is_object_in_front()) && (left_distance_sensor.is_object_near())) {
          all_leds.set_color(RED);
        }
      `

				const bytecode = CppParser.cppToByte(code)

				// Find all READ_SENSOR instructions
				const sensorIndices: number[] = []
				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
						sensorIndices.push(i)
					}
				}

				// Should have at least 2 sensor reads
				expect(sensorIndices.length).toBeGreaterThanOrEqual(2)

				// Find the first COMPARE instruction
				let firstCompareIndex = -1
				for (let i = 5; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						firstCompareIndex = i
						break
					}
				}
				expect(firstCompareIndex).toBeGreaterThan(0)

				// Should have JUMP_IF_FALSE after first comparison (for short-circuit)
				expect(bytecode[firstCompareIndex + 5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

				// Should find red LED instruction somewhere in the bytecode
				let redLedFound = false
				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
            bytecode[i + 1] === MAX_LED_BRIGHTNESS &&
            bytecode[i + 2] === 0 &&
            bytecode[i + 3] === 0) {
						redLedFound = true
						break
					}
				}
				expect(redLedFound).toBe(true)
			})

			test("should handle compound AND with mixed simple and comparison conditions", () => {
				const code = `
        bool a = true;
        if ((a) && (5 > 3)) {
          all_leds.set_color(RED);
        }
      `

				const bytecode = CppParser.cppToByte(code)

				// Find the first COMPARE instruction (for boolean variable)
				let booleanCompareIndex = -1
				for (let i = 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						booleanCompareIndex = i
						break
					}
				}
				expect(booleanCompareIndex).toBeGreaterThan(0)

				// Should be comparing with true (1)
				expect(bytecode[booleanCompareIndex + 1]).toBe(ComparisonOp.EQUAL)
				expect(bytecode[booleanCompareIndex + 3]).toBe(1) // Comparing with true

				// Should have JUMP_IF_FALSE after first comparison (short-circuit)
				expect(bytecode[booleanCompareIndex + 5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

				// Find the second COMPARE instruction (for 5 > 3)
				let valueCompareIndex = -1
				for (let i = booleanCompareIndex + 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						valueCompareIndex = i
						break
					}
				}
				expect(valueCompareIndex).toBeGreaterThan(booleanCompareIndex)

				// Should be comparing 5 > 3
				expect(bytecode[valueCompareIndex + 1]).toBe(ComparisonOp.GREATER_THAN)
				expect(bytecode[valueCompareIndex + 2]).toBe(5)
				expect(bytecode[valueCompareIndex + 3]).toBe(3)
			})
		})

		describe("OR Operator with Simple Conditions", () => {
			test("should handle compound OR with boolean variables", () => {
				const code = `
        bool a = false;
        bool b = true;
        if ((a) || (b)) {
          all_leds.set_color(RED);
        }
      `

				const bytecode = CppParser.cppToByte(code)

				// Check that we have variable declarations and assignments
				let declareVarCount = 0
				let setVarCount = 0

				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
						declareVarCount++
					} else if (bytecode[i] === BytecodeOpCode.SET_VAR) {
						setVarCount++
					}
				}

				expect(declareVarCount).toBe(2) // Two boolean variables
				expect(setVarCount).toBe(2)     // Two SET_VAR instructions

				// Find the first COMPARE instruction (for first boolean variable)
				let firstCompareIndex = -1
				for (let i = 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						firstCompareIndex = i
						break
					}
				}
				expect(firstCompareIndex).toBeGreaterThan(0)

				// Should be comparing with true (1)
				expect(bytecode[firstCompareIndex + 1]).toBe(ComparisonOp.EQUAL)
				expect(bytecode[firstCompareIndex + 3]).toBe(1) // Comparing with true

				// Should have JUMP_IF_TRUE after first comparison (short-circuit)
				expect(bytecode[firstCompareIndex + 5]).toBe(BytecodeOpCode.JUMP_IF_TRUE)

				// Find the second COMPARE instruction
				let secondCompareIndex = -1
				for (let i = firstCompareIndex + 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						secondCompareIndex = i
						break
					}
				}
				expect(secondCompareIndex).toBeGreaterThan(firstCompareIndex)

				// Should be comparing with true (1)
				expect(bytecode[secondCompareIndex + 1]).toBe(ComparisonOp.EQUAL)
				expect(bytecode[secondCompareIndex + 3]).toBe(1) // Comparing with true
			})

			test("should handle compound OR with proximity sensor functions", () => {
				const code = `
        if ((front_distance_sensor.is_object_in_front()) || (right_distance_sensor.is_object_near())) {
          all_leds.set_color(RED);
        }
      `

				const bytecode = CppParser.cppToByte(code)

				// Find all READ_SENSOR instructions
				const sensorIndices: number[] = []
				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
						sensorIndices.push(i)
					}
				}

				// Should have at least 2 sensor reads
				expect(sensorIndices.length).toBeGreaterThanOrEqual(2)

				// Find the first COMPARE instruction
				let firstCompareIndex = -1
				for (let i = 5; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						firstCompareIndex = i
						break
					}
				}
				expect(firstCompareIndex).toBeGreaterThan(0)

				// Should have JUMP_IF_TRUE after first comparison (for short-circuit)
				expect(bytecode[firstCompareIndex + 5]).toBe(BytecodeOpCode.JUMP_IF_TRUE)

				// Should find red LED instruction somewhere in the bytecode
				let redLedFound = false
				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
            bytecode[i + 1] === MAX_LED_BRIGHTNESS &&
            bytecode[i + 2] === 0 &&
            bytecode[i + 3] === 0) {
						redLedFound = true
						break
					}
				}
				expect(redLedFound).toBe(true)
			})

			test("should handle compound OR with mixed simple and comparison conditions", () => {
				const code = `
        if ((front_distance_sensor.is_object_in_front()) || (5 < 10)) {
          all_leds.set_color(RED);
        }
      `

				const bytecode = CppParser.cppToByte(code)

				// Find the sensor read instruction
				let sensorReadIndex = -1
				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
						sensorReadIndex = i
						break
					}
				}
				expect(sensorReadIndex).toBeGreaterThan(-1)

				// Find the first COMPARE instruction (for sensor value)
				let firstCompareIndex = -1
				for (let i = sensorReadIndex; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						firstCompareIndex = i
						break
					}
				}
				expect(firstCompareIndex).toBeGreaterThan(0)

				// Should have JUMP_IF_TRUE after first comparison (short-circuit)
				expect(bytecode[firstCompareIndex + 5]).toBe(BytecodeOpCode.JUMP_IF_TRUE)

				// Find the second COMPARE instruction (for 5 < 10)
				let valueCompareIndex = -1
				for (let i = firstCompareIndex + 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						valueCompareIndex = i
						break
					}
				}
				expect(valueCompareIndex).toBeGreaterThan(firstCompareIndex)

				// Should be comparing 5 < 10
				expect(bytecode[valueCompareIndex + 1]).toBe(ComparisonOp.LESS_THAN)
				expect(bytecode[valueCompareIndex + 2]).toBe(5)
				expect(bytecode[valueCompareIndex + 3]).toBe(10)
			})
		})

		describe("Edge Cases for Simple Conditions", () => {
			test("should handle boolean variable assigned from proximity sensor in compound condition", () => {
				const code = `
        bool frontSensor = front_distance_sensor.is_object_in_front();
        if ((frontSensor) && (5 > 3)) {
          all_leds.set_color(RED);
        }
      `

				const bytecode = CppParser.cppToByte(code)

				// Should have a READ_SENSOR for front proximity sensor
				let sensorReadFound = false
				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
						sensorReadFound = true
						break
					}
				}
				expect(sensorReadFound).toBe(true)

				// Find the first COMPARE instruction (for boolean variable)
				let booleanCompareIndex = -1
				for (let i = 10; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						booleanCompareIndex = i
						break
					}
				}
				expect(booleanCompareIndex).toBeGreaterThan(0)

				// Should have JUMP_IF_FALSE for AND short-circuit
				let jumpIfFalseFound = false
				for (let i = booleanCompareIndex; i < booleanCompareIndex + 10; i += 5) {
					if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
						jumpIfFalseFound = true
						break
					}
				}
				expect(jumpIfFalseFound).toBe(true)
			})
		})
	})
})
