/* eslint-disable max-lines-per-function */
import CppParser from "../../../src/classes/cpp-parser"
import { MAX_LED_BRIGHTNESS } from "../../../src/utils/constants"
import { BytecodeOpCode, CommandType, ComparisonOp, LedID, SensorType, VarType } from "../../../src/types/bytecode-types"

describe("CppParser", () => {
	// 1. Test garbage input
	describe("Invalid inputs", () => {
		test("should reject garbage input", () => {
			expect(() => {
				CppParser.cppToByte("absdajksd")
			}).toThrow()
		})

		test("should reject invalid C++ syntax", () => {
			expect(() => {
				CppParser.cppToByte("if (x > 5) { missing closing brace")
			}).toThrow()
		})
	})

	// 2.1 Test variable assignments
	describe("Variable assignments", () => {
		test("should parse integer variable assignment", () => {
			const bytecode = CppParser.cppToByte("int myVar = 42;")

			// Check if bytecode starts with DECLARE_VAR opcode
			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[1]).toBe(0) // Register 0

			// Check if SET_VAR follows the declaration
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[6]).toBe(0) // Register 0
			expect(bytecode[7]).toBe(42) // Value
			expect(bytecode[8]).toBe(0)  // Unused
		})

		test("should parse boolean variable assignment", () => {
			const bytecode = CppParser.cppToByte("bool myFlag = true;")

			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[1]).toBe(0)
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[6]).toBe(0)
			expect(bytecode[7]).toBe(1) // 1 for true
			expect(bytecode[8]).toBe(0)
		})

		test("should parse float variable assignment", () => {
			const bytecode = CppParser.cppToByte("float myFloat = 3.14;")

			// First instruction: DECLARE_VAR
			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR) // opcode
			expect(bytecode[1]).toBe(0)                        // register 0
			expect(bytecode[2]).toBe(VarType.FLOAT)            // float type
			expect(bytecode[3]).toBe(0)                        // unused
			expect(bytecode[4]).toBe(0)                        // unused

			// Second instruction: SET_VAR
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)   // opcode
			expect(bytecode[6]).toBe(0)                        // register 0
			expect(bytecode[7]).toBeCloseTo(3.14, 5)           // float value 3.14
			expect(bytecode[8]).toBe(0)                        // unused
			expect(bytecode[9]).toBe(0)                        // unused

			// Third instruction: END
			expect(bytecode[10]).toBe(BytecodeOpCode.END)
			expect(bytecode.length).toBe(15) // 3 instructions * 5
		})

		describe("Variable assignments error handling", () => {
			test("should reject unsupported variable type", () => {
				expect(() => {
					CppParser.cppToByte("char myVar = 'A';")
				}).toThrow(/Invalid command/)
			})

			test("should reject invalid boolean value", () => {
				expect(() => {
					CppParser.cppToByte("bool myFlag = maybe;")
				}).toThrow(/Invalid boolean value/)
			})

			test("should reject invalid integer value", () => {
				expect(() => {
					CppParser.cppToByte("int myNum = notAnInt;")
				}).toThrow(/Invalid integer value/)
			})

			test("should parse boolean variable assigned to 'false'", () => {
				const bytecode = CppParser.cppToByte("bool myFlag = false;")

				expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
				expect(bytecode[1]).toBe(0)
				expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
				expect(bytecode[6]).toBe(0)
				expect(bytecode[7]).toBe(0) // 0 for false
				expect(bytecode[8]).toBe(0)
			})

			test("should parse boolean variable assigned to '0'", () => {
				const bytecode = CppParser.cppToByte("bool myFlag = 0;")

				expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
				expect(bytecode[1]).toBe(0)
				expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
				expect(bytecode[6]).toBe(0)
				expect(bytecode[7]).toBe(0) // 0 for false
				expect(bytecode[8]).toBe(0)
			})

			test("should throw for unsupported variable type", () => {
				const originalIdentifyCommand = CppParser["identifyCommand"]
				CppParser["identifyCommand"] = jest.fn().mockReturnValue({
					type: CommandType.VARIABLE_ASSIGNMENT,
					matches: ["full match", "double", "testVar", "3.14"]
				})

				try {
					expect(() => {
						CppParser.cppToByte("double testVar = 3.14;")
					}).toThrow(/Unsupported type: double/)
				} finally {
					CppParser["identifyCommand"] = originalIdentifyCommand
				}
			})
		})
	})

	// 2.2 Test LED operations
	describe("LED operations", () => {
		test("should parse turn_led_off command", () => {
			const bytecode = CppParser.cppToByte("rgbLed.turn_led_off();")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(0) // R
			expect(bytecode[2]).toBe(0) // G
			expect(bytecode[3]).toBe(0) // B
			expect(bytecode[4]).toBe(0) // Unused
		})

		test("should parse set_all_leds_to_color command", () => {
			const bytecode = CppParser.cppToByte("set_all_leds_to_color(255, 127, 64);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(MAX_LED_BRIGHTNESS) // R
			expect(bytecode[2]).toBe(127) // G
			expect(bytecode[3]).toBe(64)  // B
			expect(bytecode[4]).toBe(0)   // Unused
		})

		test("should parse individual LED setting", () => {
			const bytecode = CppParser.cppToByte("rgbLed.set_top_left_led(10, 20, 30);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			expect(bytecode[1]).toBe(LedID.TOP_LEFT) // LED ID
			expect(bytecode[2]).toBe(10)             // R
			expect(bytecode[3]).toBe(20)             // G
			expect(bytecode[4]).toBe(30)             // B
		})

		describe("Individual LED operations", () => {
			test("should parse set_top_right_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_top_right_led(10, 20, 30);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(LedID.TOP_RIGHT)
				expect(bytecode[2]).toBe(10)
				expect(bytecode[3]).toBe(20)
				expect(bytecode[4]).toBe(30)
			})

			test("should parse set_middle_left_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_middle_left_led(40, 50, 60);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(LedID.MIDDLE_LEFT)
				expect(bytecode[2]).toBe(40)
				expect(bytecode[3]).toBe(50)
				expect(bytecode[4]).toBe(60)
			})

			test("should parse set_middle_right_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_middle_right_led(70, 80, 90);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(LedID.MIDDLE_RIGHT)
				expect(bytecode[2]).toBe(70)
				expect(bytecode[3]).toBe(80)
				expect(bytecode[4]).toBe(90)
			})

			test("should parse set_back_left_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_back_left_led(100, 110, 120);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(LedID.BACK_LEFT)
				expect(bytecode[2]).toBe(100)
				expect(bytecode[3]).toBe(110)
				expect(bytecode[4]).toBe(120)
			})

			test("should parse set_back_right_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_back_right_led(130, 140, 150);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(LedID.BACK_RIGHT)
				expect(bytecode[2]).toBe(130)
				expect(bytecode[3]).toBe(140)
				expect(bytecode[4]).toBe(150)
			})
		})
	})

	// 2.3 Test delay commands
	describe("Delay commands", () => {
		test("should parse delay command", () => {
			const bytecode = CppParser.cppToByte("delay(500);")

			expect(bytecode[0]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[1]).toBe(500) // Delay value
			expect(bytecode[2]).toBe(0)   // Unused
			expect(bytecode[3]).toBe(0)   // Unused
			expect(bytecode[4]).toBe(0)   // Unused
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})
	})

	// 3. Test complex programs
	describe("Combining multiple commands", () => {
		test("should parse a simple LED blink program", () => {
			const program = `
			rgbLed.set_led_red();
			delay(500);
			rgbLed.turn_led_off();
			delay(500);
		`

			const bytecode = CppParser.cppToByte(program)

			// 1st instruction: SET_ALL_LEDS (red)
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(MAX_LED_BRIGHTNESS) // R
			expect(bytecode[2]).toBe(0)   // G
			expect(bytecode[3]).toBe(0)   // B

			// 2nd instruction: DELAY
			expect(bytecode[5]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[6]).toBe(500)

			// 3rd instruction: SET_ALL_LEDS (off)
			expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[11]).toBe(0) // R
			expect(bytecode[12]).toBe(0) // G
			expect(bytecode[13]).toBe(0) // B

			// 4th instruction: DELAY
			expect(bytecode[15]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[16]).toBe(500)

			// Last instruction: END
			const lastIndex = bytecode.length - 5
			expect(bytecode[lastIndex]).toBe(BytecodeOpCode.END)
			expect(bytecode[lastIndex + 1]).toBe(0)
		})
	})
})

describe("Control flow", () => {
	test("should parse basic if-else statement", () => {
		const code = `if (5 > 10) {
		rgbLed.set_led_white();
	} else {
		rgbLed.set_led_red();
	}
	delay(1000);
	rgbLed.set_led_green();`

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

		// 6. Delay instruction
		expect(bytecode[25]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[26]).toBe(1000) // 1000ms

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
		rgbLed.set_led_blue();
	}
	rgbLed.set_led_purple();`

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
			rgbLed.set_led_green();
		} else {
			rgbLed.set_led_blue();
		}
	} else {
		rgbLed.set_led_red();
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
			{ code: "if (5 == 5) { rgbLed.set_led_red(); }", op: ComparisonOp.EQUAL },
			{ code: "if (5 != 5) { rgbLed.set_led_red(); }", op: ComparisonOp.NOT_EQUAL },
			{ code: "if (5 > 5) { rgbLed.set_led_red(); }", op: ComparisonOp.GREATER_THAN },
			{ code: "if (5 < 5) { rgbLed.set_led_red(); }", op: ComparisonOp.LESS_THAN },
			{ code: "if (5 >= 5) { rgbLed.set_led_red(); }", op: ComparisonOp.GREATER_EQUAL },
			{ code: "if (5 <= 5) { rgbLed.set_led_red(); }", op: ComparisonOp.LESS_EQUAL }
		]

		for (const test of tests) {
			const bytecode = CppParser.cppToByte(test.code)

			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(test.op)
			expect(bytecode[2]).toBe(5)
			expect(bytecode[3]).toBe(5)
			expect(bytecode[4]).toBe(0)
		}
	})

	describe("Control flow error handling", () => {
		test("should reject unsupported comparison operator", () => {
			expect(() => {
				CppParser.cppToByte("if (5 = 10) { rgbLed.set_led_red(); }")
			}).toThrow(/Unsupported operator/)
		})

		test("should reject invalid command for malformed if statement", () => {
			expect(() => {
				CppParser.cppToByte("if (5 <> 10) { rgbLed.set_led_red(); }")
			}).toThrow(/Invalid command/)
		})
	})
})

describe("While Loop Functionality", () => {
	test("should parse basic while(true) loop", () => {
		const code = `while(true) {
		rgbLed.set_led_red();
		delay(500);
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

		// 3. DELAY
		expect(bytecode[10]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[11]).toBe(500)

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
		rgbLed.set_led_red();
		while(true) {
			rgbLed.set_led_blue();
			delay(100);
		}
		delay(500);
	}`

		const bytecode = CppParser.cppToByte(code)

		// Find WHILE_START indices
		const whileStartIndices = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_START) {
				whileStartIndices.push(i)
			}
		}
		expect(whileStartIndices.length).toBe(2)

		// Find WHILE_END indices
		const whileEndIndices = []
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
				rgbLed.set_led_green();
			} else {
				rgbLed.set_led_red();
			}
			delay(1000);
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
		expect(bytecode[17]).toBe(255) // G
		expect(bytecode[18]).toBe(0)   // B

		// 5. JUMP to skip else branch (2 instructions ahead: 2 * 20 = 40 bytes)
		expect(bytecode[20]).toBe(BytecodeOpCode.JUMP)
		expect(bytecode[21]).toBe(40)

		// 6. SET_ALL_LEDS (red)
		expect(bytecode[25]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[26]).toBe(255) // R
		expect(bytecode[27]).toBe(0)   // G
		expect(bytecode[28]).toBe(0)   // B

		// 7. DELAY
		expect(bytecode[30]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[31]).toBe(1000)

		// 8. WHILE_END (jump back 7 instructions: 7 * 20 = 140 bytes)
		expect(bytecode[35]).toBe(BytecodeOpCode.WHILE_END)
		expect(bytecode[36]).toBe(140)

		// 9. END
		expect(bytecode[40]).toBe(BytecodeOpCode.END)
	})

	test("should handle multiple loops in sequence", () => {
		const code = `
		while(true) {
			rgbLed.set_led_red();
			delay(100);
		}
		while(true) {
			rgbLed.set_led_blue();
			delay(200);
		}`

		const bytecode = CppParser.cppToByte(code)

		const whileStartIndices = []
		const whileEndIndices = []
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
			rgbLed.set_led_green();
			delay(2000);
			while(true) {
				rgbLed.set_led_blue();
			}
		`

		const bytecode = CppParser.cppToByte(code)

		// 1. SET_ALL_LEDS (green)
		expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[1]).toBe(0)   // R
		expect(bytecode[2]).toBe(255) // G
		expect(bytecode[3]).toBe(0)   // B

		// 2. DELAY
		expect(bytecode[5]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[6]).toBe(2000)

		// 3. WHILE_START
		expect(bytecode[10]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[11]).toBe(0)

		// 4. SET_ALL_LEDS (blue)
		expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[16]).toBe(0)   // R
		expect(bytecode[17]).toBe(0)   // G
		expect(bytecode[18]).toBe(255) // B

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
		rgbLed.set_led_red();
		delay(100);
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

		// 5. DELAY
		expect(bytecode[20]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[21]).toBe(100)

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
		rgbLed.set_led_blue();
	}`

		const bytecode = CppParser.cppToByte(code)

		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[2]).toBe(3) // Start value
		expect(bytecode[5]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[7]).toBe(8) // End value
	})

	test("should handle multiple for loops in sequence", () => {
		const code = `for (int i = 0; i < 3; i++) {
		rgbLed.set_led_red();
	}
	for (int j = 0; j < 2; j++) {
		rgbLed.set_led_blue();
	}`

		const bytecode = CppParser.cppToByte(code)

		const forInitIndices = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(forInitIndices.length).toBe(2)
		expect(bytecode[forInitIndices[0] + 1]).toBe(0) // Register 0
		expect(bytecode[forInitIndices[1] + 1]).toBe(1) // Register 1

		const jumpBackwardIndices = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.JUMP_BACKWARD) {
				jumpBackwardIndices.push(i)
			}
		}
		expect(jumpBackwardIndices.length).toBe(2)
	})

	test("should handle nested for loops", () => {
		const code = `for (int i = 0; i < 3; i++) {
		rgbLed.set_led_red();
		for (int j = 0; j < 2; j++) {
			rgbLed.set_led_blue();
		}
	}`

		const bytecode = CppParser.cppToByte(code)

		const forInitIndices = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(forInitIndices.length).toBe(2)
		expect(bytecode[forInitIndices[0] + 1]).toBe(0)
		expect(bytecode[forInitIndices[1] + 1]).toBe(1)

		const forIncrementIndices = []
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
				rgbLed.set_led_green();
			} else {
				rgbLed.set_led_red();
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
		expect(bytecode[27]).toBe(255) // G
		expect(bytecode[28]).toBe(0)   // B

		// 7. JUMP (skip else branch, 2 instructions ahead: 2 * 20 = 40 bytes)
		expect(bytecode[30]).toBe(BytecodeOpCode.JUMP)
		expect(bytecode[31]).toBe(40)

		// 8. SET_ALL_LEDS (red)
		expect(bytecode[35]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[36]).toBe(255) // R
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
		rgbLed.set_led_white();
		delay(100);
		rgbLed.set_led_blue();
		delay(100);
		rgbLed.set_led_red();
		delay(100);
	}`

		const bytecode = CppParser.cppToByte(code)

		let delayCount = 0
		let setLedCount = 0
		for (let i = 15; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.DELAY) {
				delayCount++
			} else if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
				setLedCount++
			}
			if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
				break
			}
		}
		expect(delayCount).toBe(3)
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
		rgbLed.set_led_red();
	}
	for (int i = 0; i < 3; i++) {
		rgbLed.set_led_blue();
	}`

		const bytecode = CppParser.cppToByte(code)

		const forInitIndices = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(bytecode[forInitIndices[0] + 1]).not.toBe(bytecode[forInitIndices[1] + 1])
	})
})

describe("Sensor Functionality", () => {
	function testSensorReading(sensorMethod: string, expectedSensorType: SensorType): void {
		const code = `if (Sensors::getInstance().${sensorMethod}() > 10) {
		rgbLed.set_led_red();
	}`

		const bytecode = CppParser.cppToByte(code)

		// 1. READ_SENSOR
		expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
		expect(bytecode[1]).toBe(expectedSensorType)
		expect(bytecode[2]).toBe(0) // Register ID
		expect(bytecode[3]).toBe(0) // Unused
		expect(bytecode[4]).toBe(0) // Unused

		// 2. COMPARE
		expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[6]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[7]).toBe(0x8000) // Register reference (32768)
		expect(bytecode[8]).toBe(10)     // Right value
		expect(bytecode[9]).toBe(0)      // Unused
	}

	describe("Orientation Sensors", () => {
		test("should parse Pitch sensor reading", () => {
			testSensorReading("getPitch", SensorType.PITCH)
		})

		test("should parse Roll sensor reading", () => {
			testSensorReading("getRoll", SensorType.ROLL)
		})

		test("should parse Yaw sensor reading", () => {
			testSensorReading("getYaw", SensorType.YAW)
		})
	})

	describe("Accelerometer Sensors", () => {
		test("should parse X-axis acceleration reading", () => {
			testSensorReading("getXAccel", SensorType.ACCEL_X)
		})

		test("should parse Y-axis acceleration reading", () => {
			testSensorReading("getYAccel", SensorType.ACCEL_Y)
		})

		test("should parse Z-axis acceleration reading", () => {
			testSensorReading("getZAccel", SensorType.ACCEL_Z)
		})

		test("should parse acceleration magnitude reading", () => {
			testSensorReading("getAccelMagnitude", SensorType.ACCEL_MAG)
		})
	})

	describe("Gyroscope Sensors", () => {
		test("should parse X-axis rotation rate", () => {
			testSensorReading("getXRotationRate", SensorType.ROT_RATE_X)
		})

		test("should parse Y-axis rotation rate", () => {
			testSensorReading("getYRotationRate", SensorType.ROT_RATE_Y)
		})

		test("should parse Z-axis rotation rate", () => {
			testSensorReading("getZRotationRate", SensorType.ROT_RATE_Z)
		})
	})

	describe("Magnetometer Sensors", () => {
		test("should parse X-axis magnetic field", () => {
			testSensorReading("getMagneticFieldX", SensorType.MAG_FIELD_X)
		})

		test("should parse Y-axis magnetic field", () => {
			testSensorReading("getMagneticFieldY", SensorType.MAG_FIELD_Y)
		})

		test("should parse Z-axis magnetic field", () => {
			testSensorReading("getMagneticFieldZ", SensorType.MAG_FIELD_Z)
		})
	})

	describe("Sensor Comparison Operators", () => {
		test("should parse sensor equality comparison", () => {
			const code = `if (Sensors::getInstance().getPitch() == 0) {
			rgbLed.set_led_red();
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.PITCH)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor inequality comparison", () => {
			const code = `if (Sensors::getInstance().getYaw() != 45) {
			rgbLed.set_led_green();
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.YAW)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.NOT_EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor less than comparison", () => {
			const code = `if (Sensors::getInstance().getXAccel() < -5) {
			rgbLed.set_led_blue();
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.ACCEL_X)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.LESS_THAN)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor greater than or equal comparison", () => {
			const code = `if (Sensors::getInstance().getAccelMagnitude() >= 9.8) {
			rgbLed.set_led_purple();
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.ACCEL_MAG)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.GREATER_EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor less than or equal comparison", () => {
			const code = `if (Sensors::getInstance().getZRotationRate() <= 180) {
			rgbLed.set_led_white();
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.ROT_RATE_Z)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.LESS_EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})
	})

	describe("Complex Sensor Usage", () => {
		test("should handle sensors in if-else branches", () => {
			const code = `if (Sensors::getInstance().getPitch() > 20) {
				rgbLed.set_led_red();
			} else {
				if (Sensors::getInstance().getRoll() < -10) {
					rgbLed.set_led_blue();
				} else {
					rgbLed.set_led_green();
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
			expect(bytecode[16]).toBe(255) // R
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
			expect(bytecode[43]).toBe(255) // B

			// 10. JUMP (skip inner else, 2 instructions ahead: 2 * 20 = 40 bytes)
			expect(bytecode[45]).toBe(BytecodeOpCode.JUMP)
			expect(bytecode[46]).toBe(40)

			// 11. SET_ALL_LEDS (green)
			expect(bytecode[50]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[51]).toBe(0)   // R
			expect(bytecode[52]).toBe(255) // G
			expect(bytecode[53]).toBe(0)   // B

			// 12. END
			expect(bytecode[55]).toBe(BytecodeOpCode.END)
			expect(bytecode[56]).toBe(0)
		})

		test("should handle sensors in loops", () => {
			const code = `while (true) {
			if (Sensors::getInstance().getAccelMagnitude() > 5) {
				rgbLed.set_led_white();
			}
			delay(100);
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
			expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[6]).toBe(SensorType.ACCEL_MAG)
		})

		// TODO: Failing this test:
		test("should handle sensors in for loops", () => {
			const code = `for (int i = 0; i < 10; i++) {
			if (Sensors::getInstance().getYaw() > i) {
				rgbLed.set_led_red();
			}
		}`

			const bytecode = CppParser.cppToByte(code)

			console.log("bytecode", bytecode)
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

	test("should throw error for unknown sensor method", () => {
		const originalParseCppCode = CppParser["parseCppCode"]
		CppParser["parseCppCode"] = function(): BytecodeInstruction[] {
			return originalParseCppCode.call(this, "if (Sensors::getInstance().getNonExistent() > 10)")
		}

		try {
			expect(() => {
				CppParser.cppToByte("// This content doesn't matter due to the mock")
			}).toThrow(/Unknown sensor method/)
		} finally {
			CppParser["parseCppCode"] = originalParseCppCode
		}
	})
	// TODO: Ensure coverage is 100%

	// TODO: Add a test to assign a variable, and then read that variable elsewhere.
})
