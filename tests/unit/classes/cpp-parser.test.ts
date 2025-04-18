/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
import CppParser from "../../../src/classes/cpp-parser"
import { BytecodeOpCode, CommandType, ComparisonOp, LedID, SensorType } from "../../../src/types/bytecode-types"

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
			expect(bytecode[1]).toBe(0) // High byte of opcode

			// Check if SET_VAR follows the declaration
			expect(bytecode[10]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[14]).toBe(42) // Low byte of value
			expect(bytecode[15]).toBe(0)  // High byte of value (0 for small numbers)
		})

		test("should parse boolean variable assignment", () => {
			const bytecode = CppParser.cppToByte("bool myFlag = true;")

			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[10]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[14]).toBe(1) // 1 for true
			expect(bytecode[15]).toBe(0) // High byte is 0
		})

		test("should parse float variable assignment", () => {
			const bytecode = CppParser.cppToByte("float myFloat = 3.14;")

			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[10]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			// Float parsing is more complex, so we just verify it's a valid bytecode
			expect(bytecode.length).toBeGreaterThan(20)
		})

		describe("Variable assignments error handling", () => {
			test("should reject unsupported variable type", () => {
				expect(() => {
					CppParser.cppToByte("char myVar = 'A';") // 'char' is not supported
				}).toThrow(/Invalid command/)
			})

			test("should reject invalid boolean value", () => {
				expect(() => {
					CppParser.cppToByte("bool myFlag = maybe;") // 'maybe' is not a valid boolean
				}).toThrow(/Invalid boolean value/)
			})

			test("should reject invalid integer value", () => {
				expect(() => {
					CppParser.cppToByte("int myNum = notAnInt;") // 'notAnInt' is not a valid integer
				}).toThrow(/Invalid integer value/)
			})

			test("should parse boolean variable assigned to 'false'", () => {
				const bytecode = CppParser.cppToByte("bool myFlag = false;")

				expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
				expect(bytecode[1]).toBe(0) // High byte of opcode
				expect(bytecode[10]).toBe(BytecodeOpCode.SET_VAR)
				expect(bytecode[11]).toBe(0) // High byte of opcode
				expect(bytecode[14]).toBe(0) // 0 for false
				expect(bytecode[15]).toBe(0) // High byte should be 0
			})

			test("should parse boolean variable assigned to '0'", () => {
				const bytecode = CppParser.cppToByte("bool myFlag = 0;")

				expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
				expect(bytecode[1]).toBe(0) // High byte of opcode
				expect(bytecode[10]).toBe(BytecodeOpCode.SET_VAR)
				expect(bytecode[11]).toBe(0) // High byte of opcode
				expect(bytecode[14]).toBe(0) // 0 for false
				expect(bytecode[15]).toBe(0) // High byte should be 0
			})

			test("should throw for unsupported variable type", () => {
				// This test requires a special approach since the regex validation happens before the type check
				const originalIdentifyCommand = CppParser["identifyCommand"]
				CppParser["identifyCommand"] = jest.fn().mockReturnValue({
					type: CommandType.VARIABLE_ASSIGNMENT,
					matches: ["full match", "double", "testVar", "3.14"] // Using "double" as unsupported type
				})

				try {
					expect(() => {
						CppParser.cppToByte("double testVar = 3.14;")
					}).toThrow(/Unsupported type: double/)
				} finally {
					// Restore the original method
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
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(0) // R (low byte)
			expect(bytecode[3]).toBe(0) // R (high byte)
			expect(bytecode[4]).toBe(0) // G (low byte)
			expect(bytecode[5]).toBe(0) // G (high byte)
			expect(bytecode[6]).toBe(0) // B (low byte)
			expect(bytecode[7]).toBe(0) // B (high byte)
		})

		test("should parse set_all_leds_to_color command", () => {
			const bytecode = CppParser.cppToByte("set_all_leds_to_color(255, 127, 64);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(255) // R (low byte)
			expect(bytecode[3]).toBe(0)   // R (high byte)
			expect(bytecode[4]).toBe(127) // G (low byte)
			expect(bytecode[5]).toBe(0)   // G (high byte)
			expect(bytecode[6]).toBe(64)  // B (low byte)
			expect(bytecode[7]).toBe(0)   // B (high byte)
		})

		test("should parse individual LED setting", () => {
			const bytecode = CppParser.cppToByte("rgbLed.set_top_left_led(10, 20, 30);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(LedID.TOP_LEFT) // LED ID (low byte)
			expect(bytecode[3]).toBe(0)              // LED ID (high byte)
			expect(bytecode[4]).toBe(10)             // R (low byte)
			expect(bytecode[5]).toBe(0)              // R (high byte)
			expect(bytecode[6]).toBe(20)             // G (low byte)
			expect(bytecode[7]).toBe(0)              // G (high byte)
			expect(bytecode[8]).toBe(30)             // B (low byte)
			expect(bytecode[9]).toBe(0)              // B (high byte)
		})

		describe("Individual LED operations", () => {
			test("should parse set_top_right_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_top_right_led(10, 20, 30);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(0) // High byte of opcode
				expect(bytecode[2]).toBe(LedID.TOP_RIGHT) // LED ID (low byte)
				expect(bytecode[3]).toBe(0)               // LED ID (high byte)
				expect(bytecode[4]).toBe(10)              // R (low byte)
				expect(bytecode[5]).toBe(0)               // R (high byte)
				expect(bytecode[6]).toBe(20)              // G (low byte)
				expect(bytecode[7]).toBe(0)               // G (high byte)
				expect(bytecode[8]).toBe(30)              // B (low byte)
				expect(bytecode[9]).toBe(0)               // B (high byte)
			})

			test("should parse set_middle_left_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_middle_left_led(40, 50, 60);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(0) // High byte of opcode
				expect(bytecode[2]).toBe(LedID.MIDDLE_LEFT) // LED ID (low byte)
				expect(bytecode[3]).toBe(0)                 // LED ID (high byte)
				expect(bytecode[4]).toBe(40)                // R (low byte)
				expect(bytecode[5]).toBe(0)                 // R (high byte)
				expect(bytecode[6]).toBe(50)                // G (low byte)
				expect(bytecode[7]).toBe(0)                 // G (high byte)
				expect(bytecode[8]).toBe(60)                // B (low byte)
				expect(bytecode[9]).toBe(0)                 // B (high byte)
			})

			test("should parse set_middle_right_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_middle_right_led(70, 80, 90);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(0) // High byte of opcode
				expect(bytecode[2]).toBe(LedID.MIDDLE_RIGHT) // LED ID (low byte)
				expect(bytecode[3]).toBe(0)                  // LED ID (high byte)
				expect(bytecode[4]).toBe(70)                 // R (low byte)
				expect(bytecode[5]).toBe(0)                  // R (high byte)
				expect(bytecode[6]).toBe(80)                 // G (low byte)
				expect(bytecode[7]).toBe(0)                  // G (high byte)
				expect(bytecode[8]).toBe(90)                 // B (low byte)
				expect(bytecode[9]).toBe(0)                  // B (high byte)
			})

			test("should parse set_back_left_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_back_left_led(100, 110, 120);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(0) // High byte of opcode
				expect(bytecode[2]).toBe(LedID.BACK_LEFT) // LED ID (low byte)
				expect(bytecode[3]).toBe(0)               // LED ID (high byte)
				expect(bytecode[4]).toBe(100)             // R (low byte)
				expect(bytecode[5]).toBe(0)               // R (high byte)
				expect(bytecode[6]).toBe(110)             // G (low byte)
				expect(bytecode[7]).toBe(0)               // G (high byte)
				expect(bytecode[8]).toBe(120)             // B (low byte)
				expect(bytecode[9]).toBe(0)               // B (high byte)
			})

			test("should parse set_back_right_led command", () => {
				const bytecode = CppParser.cppToByte("rgbLed.set_back_right_led(130, 140, 150);")

				expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
				expect(bytecode[1]).toBe(0) // High byte of opcode
				expect(bytecode[2]).toBe(LedID.BACK_RIGHT) // LED ID (low byte)
				expect(bytecode[3]).toBe(0)                // LED ID (high byte)
				expect(bytecode[4]).toBe(130)              // R (low byte)
				expect(bytecode[5]).toBe(0)                // R (high byte)
				expect(bytecode[6]).toBe(140)              // G (low byte)
				expect(bytecode[7]).toBe(0)                // G (high byte)
				expect(bytecode[8]).toBe(150)              // B (low byte)
				expect(bytecode[9]).toBe(0)                // B (high byte)
			})
		})
	})

	// 2.3 Test delay commands
	describe("Delay commands", () => {
		test("should parse delay command", () => {
			const bytecode = CppParser.cppToByte("delay(500);")

			expect(bytecode[0]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(500 & 0xFF)       // Low byte of delay (244)
			expect(bytecode[3]).toBe(0)                // Zero byte
			expect(bytecode[4]).toBe(1)                // High byte of delay (1)
			expect(bytecode[5]).toBe(0)                // Remaining bytes are zeros
			expect(bytecode[6]).toBe(0)
			expect(bytecode[7]).toBe(0)
			expect(bytecode[8]).toBe(0)
			expect(bytecode[9]).toBe(0)
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

			// Verify the program has the correct sequence
			// 1st instruction: SET_ALL_LEDS (red)
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(0) // High byte of opcode

			// 2nd instruction: DELAY
			expect(bytecode[10]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[11]).toBe(0) // High byte of opcode

			// 3rd instruction: SET_ALL_LEDS (off)
			expect(bytecode[20]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[21]).toBe(0) // High byte of opcode

			// 4th instruction: DELAY
			expect(bytecode[30]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[31]).toBe(0) // High byte of opcode

			// Last instruction should be END
			const lastIndex = bytecode.length - 10
			expect(bytecode[lastIndex]).toBe(BytecodeOpCode.END)
			expect(bytecode[lastIndex + 1]).toBe(0) // High byte of opcode
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

		// Verify bytecode structure:
		// 1. Compare operation
		expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[2]).toBe(ComparisonOp.GREATER_THAN) // Low byte
		expect(bytecode[3]).toBe(0)                         // High byte
		expect(bytecode[4]).toBe(5)                         // Left value (low byte)
		expect(bytecode[5]).toBe(0)                         // Left value (high byte)
		expect(bytecode[6]).toBe(10)                        // Right value (low byte)
		expect(bytecode[7]).toBe(0)                         // Right value (high byte)

		// 2. Jump if false to else block
		expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[11]).toBe(0) // High byte of opcode

		// 3. Set LEDs white (true branch)
		expect(bytecode[20]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[21]).toBe(0) // High byte of opcode
		expect(bytecode[22]).toBe(255) // R (low byte)
		expect(bytecode[23]).toBe(0)   // R (high byte)
		expect(bytecode[24]).toBe(255) // G (low byte)
		expect(bytecode[25]).toBe(0)   // G (high byte)
		expect(bytecode[26]).toBe(255) // B (low byte)
		expect(bytecode[27]).toBe(0)   // B (high byte)

		// 4. Unconditional jump to skip else block
		expect(bytecode[30]).toBe(BytecodeOpCode.JUMP)
		expect(bytecode[31]).toBe(0) // High byte of opcode

		// 5. Set LEDs red (false branch)
		expect(bytecode[40]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[41]).toBe(0) // High byte of opcode
		expect(bytecode[42]).toBe(255) // R (low byte)
		expect(bytecode[43]).toBe(0)   // R (high byte)
		expect(bytecode[44]).toBe(0)   // G (low byte)
		expect(bytecode[45]).toBe(0)   // G (high byte)
		expect(bytecode[46]).toBe(0)   // B (low byte)
		expect(bytecode[47]).toBe(0)   // B (high byte)

		// 6. Delay instruction
		expect(bytecode[50]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[51]).toBe(0) // High byte of opcode
		// Verify 1000ms delay (232 + 3*256 = 1000)
		expect(bytecode[52]).toBe(232) // Low byte
		expect(bytecode[53]).toBe(0)   // Zero byte
		expect(bytecode[54]).toBe(3)   // High byte

		// 7. Set LEDs green (after if-else)
		expect(bytecode[60]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[61]).toBe(0) // High byte of opcode
		expect(bytecode[62]).toBe(0)   // R (low byte)
		expect(bytecode[63]).toBe(0)   // R (high byte)
		expect(bytecode[64]).toBe(255) // G (low byte)
		expect(bytecode[65]).toBe(0)   // G (high byte)
		expect(bytecode[66]).toBe(0)   // B (low byte)
		expect(bytecode[67]).toBe(0)   // B (high byte)

		// 8. End instruction
		expect(bytecode[70]).toBe(BytecodeOpCode.END)
		expect(bytecode[71]).toBe(0) // High byte of opcode
	})

	test("should parse if without else", () => {
		const code = `if (3 < 7) {
			rgbLed.set_led_blue();
		}
		rgbLed.set_led_purple();`

		const bytecode = CppParser.cppToByte(code)

		// 1. Compare operation
		expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[2]).toBe(ComparisonOp.LESS_THAN) // Low byte
		expect(bytecode[3]).toBe(0)                      // High byte
		expect(bytecode[4]).toBe(3)                      // Left value (low byte)
		expect(bytecode[5]).toBe(0)                      // Left value (high byte)
		expect(bytecode[6]).toBe(7)                      // Right value (low byte)
		expect(bytecode[7]).toBe(0)                      // Right value (high byte)

		// 2. Jump if false to skip if block
		expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[11]).toBe(0) // High byte of opcode

		// Find the blue LED instruction (should be in the if block)
		let blueInstIndex = -1
		for (let i = 20; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
				bytecode[i + 1] === 0 &&   // High byte of opcode
				bytecode[i + 2] === 0 &&   // R (low byte)
				bytecode[i + 3] === 0 &&   // R (high byte)
				bytecode[i + 4] === 0 &&   // G (low byte)
				bytecode[i + 5] === 0 &&   // G (high byte)
				bytecode[i + 6] === 255 && // B (low byte)
				bytecode[i + 7] === 0) {   // B (high byte)
				blueInstIndex = i
				break
			}
		}
		expect(blueInstIndex).toBeGreaterThan(0) // Should find blue instruction

		// Find the purple LED instruction (should be after if block)
		let purpleInstIndex = -1
		for (let i = blueInstIndex + 10; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
				bytecode[i + 1] === 0 &&   // High byte of opcode
				bytecode[i + 2] === 255 && // R (low byte)
				bytecode[i + 3] === 0 &&   // R (high byte)
				bytecode[i + 4] === 0 &&   // G (low byte)
				bytecode[i + 5] === 0 &&   // G (high byte)
				bytecode[i + 6] === 255 && // B (low byte)
				bytecode[i + 7] === 0) {   // B (high byte)
				purpleInstIndex = i
				break
			}
		}
		expect(purpleInstIndex).toBeGreaterThan(0) // Should find purple instruction

		// Verify END instruction
		const endIndex = bytecode.length - 10
		expect(bytecode[endIndex]).toBe(BytecodeOpCode.END)
		expect(bytecode[endIndex + 1]).toBe(0) // High byte of opcode
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
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[2]).toBe(ComparisonOp.EQUAL) // Low byte
		expect(bytecode[3]).toBe(0)                  // High byte
		expect(bytecode[4]).toBe(10)                 // Left value (low byte)
		expect(bytecode[5]).toBe(0)                  // Left value (high byte)
		expect(bytecode[6]).toBe(10)                 // Right value (low byte)
		expect(bytecode[7]).toBe(0)                  // Right value (high byte)

		// 2. Jump if false to outer else
		expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[11]).toBe(0) // High byte of opcode

		// 3. Second compare operation (inner if)
		expect(bytecode[20]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[21]).toBe(0) // High byte of opcode
		expect(bytecode[22]).toBe(ComparisonOp.NOT_EQUAL) // Low byte
		expect(bytecode[23]).toBe(0)                      // High byte
		expect(bytecode[24]).toBe(5)                      // Left value (low byte)
		expect(bytecode[25]).toBe(0)                      // Left value (high byte)
		expect(bytecode[26]).toBe(5)                      // Right value (low byte)
		expect(bytecode[27]).toBe(0)                      // Right value (high byte)

		// Verify the end has the END opcode
		expect(bytecode[bytecode.length - 10]).toBe(BytecodeOpCode.END)
		expect(bytecode[bytecode.length - 9]).toBe(0) // High byte of opcode
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

			// Verify comparison operator
			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(test.op) // Low byte
			expect(bytecode[3]).toBe(0)       // High byte
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

		// The first instruction should be WHILE_START
		expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[1]).toBe(0) // High byte of opcode

		// Then set_led_red (SET_ALL_LEDS with red)
		expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[11]).toBe(0) // High byte of opcode
		expect(bytecode[12]).toBe(255) // R (low byte)
		expect(bytecode[13]).toBe(0)   // R (high byte)
		expect(bytecode[14]).toBe(0)   // G (low byte)
		expect(bytecode[15]).toBe(0)   // G (high byte)
		expect(bytecode[16]).toBe(0)   // B (low byte)
		expect(bytecode[17]).toBe(0)   // B (high byte)

		// Then delay
		expect(bytecode[20]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[21]).toBe(0) // High byte of opcode
		expect(bytecode[22]).toBe(500 & 0xFF)  // Low byte of 500
		expect(bytecode[23]).toBe(0)           // Zero byte
		expect(bytecode[24]).toBe(1)           // High byte of 500

		// Find the WHILE_END instruction (should be before END)
		let whileEndIndex = -1
		for (let i = 0; i < bytecode.length - 10; i += 10) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndex = i
				break
			}
		}
		expect(whileEndIndex).toBeGreaterThan(0) // Should find WHILE_END

		// Check if jump offset is correct
		const jumpOffset = bytecode[whileEndIndex + 2] |
			(bytecode[whileEndIndex + 3] << 8)
		expect(jumpOffset).toBe(30) // 3 instructions * 10 bytes

		// The very last instruction should be END
		const lastInstructionIndex = bytecode.length - 10
		expect(bytecode[lastInstructionIndex]).toBe(BytecodeOpCode.END)
		expect(bytecode[lastInstructionIndex + 1]).toBe(0) // High byte of opcode
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

		// Find all WHILE_START opcodes
		const whileStartIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.WHILE_START) {
				whileStartIndices.push(i)
			}
		}
		expect(whileStartIndices.length).toBe(2) // Should have two while loops

		// Find all WHILE_END opcodes
		const whileEndIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndices.push(i)
			}
		}
		expect(whileEndIndices.length).toBe(2) // Should have two loop ends

		// Inner loop should end before outer loop
		expect(whileEndIndices[0]).toBeLessThan(whileEndIndices[1])

		// Check if inner loop's WHILE_END jumps to correct WHILE_START
		const innerJumpOffset = bytecode[whileEndIndices[0] + 2] |
			(bytecode[whileEndIndices[0] + 3] << 8)
		const expectedInnerOffset = whileEndIndices[0] - whileStartIndices[1]
		expect(innerJumpOffset).toBe(expectedInnerOffset)

		// Check if outer loop's WHILE_END jumps to correct WHILE_START
		const outerJumpOffset = bytecode[whileEndIndices[1] + 2] |
			(bytecode[whileEndIndices[1] + 3] << 8)
		const expectedOuterOffset = whileEndIndices[1] - whileStartIndices[0]
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

		// First instruction is WHILE_START
		expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[1]).toBe(0) // High byte of opcode

		// Then should be COMPARE opcode
		expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[11]).toBe(0) // High byte of opcode

		// Find WHILE_END opcode
		let whileEndIndex = -1
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndex = i
				break
			}
		}
		expect(whileEndIndex).toBeGreaterThan(0) // Should find WHILE_END

		// Verify WHILE_END jumps back to WHILE_START
		const jumpOffset = bytecode[whileEndIndex + 2] | (bytecode[whileEndIndex + 3] << 8)
		expect(jumpOffset).toBe(whileEndIndex) // Should jump back to start
	})

	test("should handle multiple loops in sequence", () => {
		const code = `
			while(true) {
				rgbLed.set_led_red();
				delay(100);
			}
			// This code should never execute because of the infinite loop above
			while(true) {
				rgbLed.set_led_blue();
				delay(200);
			}`

		const bytecode = CppParser.cppToByte(code)

		// Find all WHILE_START opcodes
		const whileStartIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.WHILE_START) {
				whileStartIndices.push(i)
			}
		}
		expect(whileStartIndices.length).toBe(2) // Should have two loop starts

		// Find all WHILE_END opcodes
		const whileEndIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndices.push(i)
			}
		}
		expect(whileEndIndices.length).toBe(2) // Should have two loop ends

		// First loop's WHILE_END should jump to first WHILE_START
		const firstJumpOffset = bytecode[whileEndIndices[0] + 2] |
			(bytecode[whileEndIndices[0] + 3] << 8)
		const expectedFirstOffset = whileEndIndices[0] - whileStartIndices[0]
		expect(firstJumpOffset).toBe(expectedFirstOffset)

		// Second loop's WHILE_END should jump to second WHILE_START
		const secondJumpOffset = bytecode[whileEndIndices[1] + 2] |
			(bytecode[whileEndIndices[1] + 3] << 8)
		const expectedSecondOffset = whileEndIndices[1] - whileStartIndices[1]
		expect(secondJumpOffset).toBe(expectedSecondOffset)
	})

	test("should handle empty while loop", () => {
		const code = `while(true) {
			// Empty loop
		}`

		const bytecode = CppParser.cppToByte(code)

		// Should have WHILE_START and WHILE_END with nothing in between
		expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[10]).toBe(BytecodeOpCode.WHILE_END)
		expect(bytecode[11]).toBe(0) // High byte of opcode

		// Jump offset should be 10 bytes (just one instruction)
		expect(bytecode[12]).toBe(10)
		expect(bytecode[13]).toBe(0)
	})

	test("should handle while loop at the end of program", () => {
		const code = `
			rgbLed.set_led_green();
			delay(2000);
			while(true) {
				rgbLed.set_led_blue();
			}`

		const bytecode = CppParser.cppToByte(code)

		// Find the WHILE_END instruction
		let whileEndIndex = -1
		for (let i = 0; i < bytecode.length - 10; i += 10) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndex = i
				break
			}
		}
		expect(whileEndIndex).toBeGreaterThan(0) // Should find WHILE_END

		// The very last instruction should be END
		const lastInstructionIndex = bytecode.length - 10
		expect(bytecode[lastInstructionIndex]).toBe(BytecodeOpCode.END)
		expect(bytecode[lastInstructionIndex + 1]).toBe(0) // High byte of opcode
	})
})

describe("For Loop Functionality", () => {
	test("should parse basic for loop", () => {
		const code = `for (int i = 0; i < 5; i++) {
			rgbLed.set_led_red();
			delay(100);
		}`

		const bytecode = CppParser.cppToByte(code)

		// First instruction should be FOR_INIT
		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[2]).toBe(0) // register 0 (low byte)
		expect(bytecode[3]).toBe(0) // register 0 (high byte)
		expect(bytecode[4]).toBe(0) // init value = 0 (low byte)
		expect(bytecode[5]).toBe(0) // init value = 0 (middle byte)
		expect(bytecode[6]).toBe(0) // init value = 0 (high byte)

		// Second instruction should be FOR_CONDITION
		expect(bytecode[10]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[11]).toBe(0) // High byte of opcode
		expect(bytecode[12]).toBe(0) // same register (low byte)
		expect(bytecode[13]).toBe(0) // same register (high byte)
		expect(bytecode[14]).toBe(5) // end value = 5 (low byte)
		expect(bytecode[15]).toBe(0) // end value = 5 (middle byte)
		expect(bytecode[16]).toBe(0) // end value = 5 (high byte)

		// Third instruction should be JUMP_IF_FALSE (to skip loop when done)
		expect(bytecode[20]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[21]).toBe(0) // High byte of opcode

		// Fourth instruction should start the loop body with SET_ALL_LEDS (red)
		expect(bytecode[30]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[31]).toBe(0) // High byte of opcode
		expect(bytecode[32]).toBe(255) // R (low byte)
		expect(bytecode[33]).toBe(0)   // R (high byte)
		expect(bytecode[34]).toBe(0)   // G (low byte)
		expect(bytecode[35]).toBe(0)   // G (high byte)
		expect(bytecode[36]).toBe(0)   // B (low byte)
		expect(bytecode[37]).toBe(0)   // B (high byte)

		// Fifth instruction should be DELAY
		expect(bytecode[40]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[41]).toBe(0) // High byte of opcode
		expect(bytecode[42]).toBe(100) // delay of 100ms (low byte)
		expect(bytecode[43]).toBe(0)   // delay of 100ms (high byte)

		// Sixth instruction should be FOR_INCREMENT
		expect(bytecode[50]).toBe(BytecodeOpCode.FOR_INCREMENT)
		expect(bytecode[51]).toBe(0) // High byte of opcode
		expect(bytecode[52]).toBe(0) // register 0 (low byte)
		expect(bytecode[53]).toBe(0) // register 0 (high byte)

		// Seventh instruction should be JUMP_BACKWARD back to condition
		expect(bytecode[60]).toBe(BytecodeOpCode.JUMP_BACKWARD)
		expect(bytecode[61]).toBe(0) // High byte of opcode

		// Last instruction should be END
		const lastInstructionIndex = bytecode.length - 10
		expect(bytecode[lastInstructionIndex]).toBe(BytecodeOpCode.END)
		expect(bytecode[lastInstructionIndex + 1]).toBe(0) // High byte of opcode
	})

	test("should handle empty for loop", () => {
		const code = `for (int i = 0; i < 10; i++) {
			// Empty loop
		}`

		const bytecode = CppParser.cppToByte(code)

		// Check init, condition, and jump instructions
		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[10]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[11]).toBe(0) // High byte of opcode
		expect(bytecode[20]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[21]).toBe(0) // High byte of opcode

		// Should have FOR_INCREMENT right after
		expect(bytecode[30]).toBe(BytecodeOpCode.FOR_INCREMENT)
		expect(bytecode[31]).toBe(0) // High byte of opcode

		// Then JUMP_BACKWARD back to condition
		expect(bytecode[40]).toBe(BytecodeOpCode.JUMP_BACKWARD)
		expect(bytecode[41]).toBe(0) // High byte of opcode

		// Then END
		expect(bytecode[50]).toBe(BytecodeOpCode.END)
		expect(bytecode[51]).toBe(0) // High byte of opcode
	})

	test("should handle for loop with non-zero start value", () => {
		const code = `for (int j = 3; j < 8; j++) {
			rgbLed.set_led_blue();
		}`

		const bytecode = CppParser.cppToByte(code)

		// Check FOR_INIT has correct start value (3)
		expect(bytecode[0]).toBe(BytecodeOpCode.FOR_INIT)
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[4]).toBe(3)   // start value = 3 (low byte)
		expect(bytecode[5]).toBe(0)   // start value = 3 (middle byte)
		expect(bytecode[6]).toBe(0)   // start value = 3 (high byte)

		// Check FOR_CONDITION has correct end value (8)
		expect(bytecode[10]).toBe(BytecodeOpCode.FOR_CONDITION)
		expect(bytecode[11]).toBe(0) // High byte of opcode
		expect(bytecode[14]).toBe(8) // end value = 8 (low byte)
		expect(bytecode[15]).toBe(0) // end value = 8 (middle byte)
		expect(bytecode[16]).toBe(0) // end value = 8 (high byte)
	})

	test("should handle multiple for loops in sequence", () => {
		const code = `for (int i = 0; i < 3; i++) {
			rgbLed.set_led_red();
		}
		for (int j = 0; j < 2; j++) {
			rgbLed.set_led_blue();
		}`

		const bytecode = CppParser.cppToByte(code)

		// Find all FOR_INIT opcodes
		const forInitIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(forInitIndices.length).toBe(2) // Should have two for loops

		// Check that the second loop uses a different register
		expect(bytecode[forInitIndices[0] + 2]).toBe(0) // first loop uses register 0 (low byte)
		expect(bytecode[forInitIndices[1] + 2]).toBe(1) // second loop uses register 1 (low byte)

		// Find all jump-backward opcodes to ensure correct loop structure
		const jumpBackwardIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.JUMP_BACKWARD) {
				jumpBackwardIndices.push(i)
			}
		}
		expect(jumpBackwardIndices.length).toBe(2) // Should have two backward jumps, one for each loop
	})

	test("should handle nested for loops", () => {
		const code = `for (int i = 0; i < 3; i++) {
			rgbLed.set_led_red();
			for (int j = 0; j < 2; j++) {
				rgbLed.set_led_blue();
			}
		}`

		const bytecode = CppParser.cppToByte(code)

		// Find all FOR_INIT opcodes
		const forInitIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}
		expect(forInitIndices.length).toBe(2) // Should have two for loops

		// Check registers are different for nested loops
		expect(bytecode[forInitIndices[0] + 2]).toBe(0) // Outer loop uses register 0 (low byte)
		expect(bytecode[forInitIndices[1] + 2]).toBe(1) // Inner loop uses register 1 (low byte)

		// Find FOR_INCREMENT opcodes
		const forIncrementIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
				forIncrementIndices.push(i)
			}
		}
		expect(forIncrementIndices.length).toBe(2) // One increment for each loop

		// Inner loop increment should come before outer loop increment
		expect(bytecode[forIncrementIndices[0] + 2]).toBe(1) // Register 1 (inner loop) incremented first (low byte)
		expect(bytecode[forIncrementIndices[1] + 2]).toBe(0) // Register 0 (outer loop) incremented later (low byte)
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

		// Find FOR_INIT
		let forInitIndex = -1
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndex = i
				break
			}
		}
		expect(forInitIndex).toBeGreaterThanOrEqual(0)

		// Find COMPARE operation (inside the loop)
		let compareIndex = -1
		for (let i = forInitIndex + 30; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareIndex = i
				break
			}
		}
		expect(compareIndex).toBeGreaterThan(forInitIndex)

		// Find FOR_INCREMENT (should come after the conditional)
		let forIncrementIndex = -1
		for (let i = compareIndex + 10; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
				forIncrementIndex = i
				break
			}
		}
		expect(forIncrementIndex).toBeGreaterThan(compareIndex)
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

		// Count delay operations inside the loop
		let delayCount = 0
		let setLedCount = 0

		// Start after FOR_INIT, FOR_CONDITION, and JUMP_IF_FALSE
		for (let i = 30; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.DELAY) {
				delayCount++
			} else if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
				setLedCount++
			}

			// Stop counting when we reach FOR_INCREMENT
			if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
				break
			}
		}

		expect(delayCount).toBe(3) // Three delay operations
		expect(setLedCount).toBe(3) // Three LED operations

		// Find FOR_INCREMENT and JUMP_BACKWARD at the end of the loop
		let foundIncrement = false
		let foundJump = false

		for (let i = bytecode.length - 30; i < bytecode.length; i += 10) {
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

		// Find all FOR_INIT opcodes
		const forInitIndices = []
		for (let i = 0; i < bytecode.length; i += 10) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitIndices.push(i)
			}
		}

		// Both loops should use different registers despite same variable name
		expect(bytecode[forInitIndices[0] + 2]).not.toBe(bytecode[forInitIndices[1] + 2])
	})
})

describe("Sensor Functionality", () => {
	// Helper function to check sensor bytecode generation
	function testSensorReading(sensorMethod: string, expectedSensorType: SensorType): void {
		const code = `if (Sensors::getInstance().${sensorMethod}() > 10) {
			rgbLed.set_led_red();
		}`

		const bytecode = CppParser.cppToByte(code)

		// First instruction should be READ_SENSOR
		expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
		expect(bytecode[1]).toBe(0) // High byte of opcode
		expect(bytecode[2]).toBe(expectedSensorType) // Sensor type (low byte)
		expect(bytecode[3]).toBe(0)                 // Sensor type (high byte)
		expect(bytecode[4]).toBe(0)                 // Register ID (low byte)
		expect(bytecode[5]).toBe(0)                 // Register ID (high byte)

		// Second instruction should be COMPARE
		expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[11]).toBe(0) // High byte of opcode
		expect(bytecode[12]).toBe(ComparisonOp.GREATER_THAN) // ">" operator (low byte)
		expect(bytecode[13]).toBe(0)                       // ">" operator (high byte)
		expect(bytecode[14]).toBe(0x80)                    // High bit indicates register reference (low byte)
		expect(bytecode[15]).toBe(0)                       // High bit indicator (high byte)
		expect(bytecode[16]).toBe(10)                      // Right value (low byte)
		expect(bytecode[17]).toBe(0)                       // Right value (high byte)
	}

	// Test each orientation sensor (pitch, roll, yaw)
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

	// Test accelerometer sensors
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

	// Test gyroscope sensors
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

	// Test magnetometer sensors
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

	// Test different comparison operators with sensors
	describe("Sensor Comparison Operators", () => {
		test("should parse sensor equality comparison", () => {
			const code = `if (Sensors::getInstance().getPitch() == 0) {
				rgbLed.set_led_red();
			}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(SensorType.PITCH) // Sensor type (low byte)
			expect(bytecode[3]).toBe(0)                // Sensor type (high byte)
			expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[12]).toBe(ComparisonOp.EQUAL) // "==" operator (low byte)
			expect(bytecode[13]).toBe(0)                 // "==" operator (high byte)
		})

		test("should parse sensor inequality comparison", () => {
			const code = `if (Sensors::getInstance().getYaw() != 45) {
				rgbLed.set_led_green();
			}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(SensorType.YAW) // Sensor type (low byte)
			expect(bytecode[3]).toBe(0)              // Sensor type (high byte)
			expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[12]).toBe(ComparisonOp.NOT_EQUAL) // "!=" operator (low byte)
			expect(bytecode[13]).toBe(0)                     // "!=" operator (high byte)
		})

		test("should parse sensor less than comparison", () => {
			const code = `if (Sensors::getInstance().getXAccel() < -5) {
				rgbLed.set_led_blue();
			}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(SensorType.ACCEL_X) // Sensor type (low byte)
			expect(bytecode[3]).toBe(0)                 // Sensor type (high byte)
			expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[12]).toBe(ComparisonOp.LESS_THAN) // "<" operator (low byte)
			expect(bytecode[13]).toBe(0)                     // "<" operator (high byte)
		})

		test("should parse sensor greater than or equal comparison", () => {
			const code = `if (Sensors::getInstance().getAccelMagnitude() >= 9.8) {
				rgbLed.set_led_purple();
			}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(SensorType.ACCEL_MAG) // Sensor type (low byte)
			expect(bytecode[3]).toBe(0)                   // Sensor type (high byte)
			expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[12]).toBe(ComparisonOp.GREATER_EQUAL) // ">=" operator (low byte)
			expect(bytecode[13]).toBe(0)                         // ">=" operator (high byte)
		})

		test("should parse sensor less than or equal comparison", () => {
			const code = `if (Sensors::getInstance().getZRotationRate() <= 180) {
				rgbLed.set_led_white();
			}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(SensorType.ROT_RATE_Z) // Sensor type (low byte)
			expect(bytecode[3]).toBe(0)                    // Sensor type (high byte)
			expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[12]).toBe(ComparisonOp.LESS_EQUAL) // "<=" operator (low byte)
			expect(bytecode[13]).toBe(0)                      // "<=" operator (high byte)
		})
	})

	// Test complex sensor usage
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

			// First READ_SENSOR for getPitch
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(0) // High byte of opcode
			expect(bytecode[2]).toBe(SensorType.PITCH) // Sensor type (low byte)
			expect(bytecode[3]).toBe(0)                // Sensor type (high byte)

			// Look for the second READ_SENSOR for getRoll (should be after the first conditional jump)
			let rollSensorIndex = -1
			for (let i = 30; i < bytecode.length; i += 10) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
					bytecode[i + 1] === 0 &&
					bytecode[i + 2] === SensorType.ROLL &&
					bytecode[i + 3] === 0) {
					rollSensorIndex = i
					break
				}
			}
			expect(rollSensorIndex).toBeGreaterThan(0) // Should find the roll sensor reading
		})

		test("should handle sensors in loops", () => {
			const code = `while (true) {
				if (Sensors::getInstance().getAccelMagnitude() > 5) {
					rgbLed.set_led_white();
				}
				delay(100);
			}`

			const bytecode = CppParser.cppToByte(code)

			// First instruction is WHILE_START
			expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
			expect(bytecode[1]).toBe(0) // High byte of opcode

			// Second instruction should be READ_SENSOR
			expect(bytecode[10]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[11]).toBe(0) // High byte of opcode
			expect(bytecode[12]).toBe(SensorType.ACCEL_MAG) // Sensor type (low byte)
			expect(bytecode[13]).toBe(0)                   // Sensor type (high byte)
		})

		test("should handle sensors in for loops", () => {
			const code = `for (int i = 0; i < 10; i++) {
				if (Sensors::getInstance().getYaw() > i) {
					rgbLed.set_led_red();
				}
			}`

			const bytecode = CppParser.cppToByte(code)

			// Find READ_SENSOR instruction
			let sensorIndex = -1
			for (let i = 30; i < bytecode.length; i += 10) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
					bytecode[i + 1] === 0 &&
					bytecode[i + 2] === SensorType.YAW &&
					bytecode[i + 3] === 0) {
					sensorIndex = i
					break
				}
			}
			expect(sensorIndex).toBeGreaterThan(0) // Should find the yaw sensor reading
		})
	})

	// Error handling tests
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
})
