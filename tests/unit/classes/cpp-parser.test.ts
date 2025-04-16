/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
import CppParser from "../../../src/classes/cpp-parser"
import { BytecodeOpCode, ComparisonOp, LedID } from "../../../src/types/bytecode-types"

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

			// Check if SET_VAR follows the declaration
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[7]).toBe(42) // Low byte of value
		})

		test("should parse boolean variable assignment", () => {
			const bytecode = CppParser.cppToByte("bool myFlag = true;")

			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[7]).toBe(1) // 1 for true
		})

		test("should parse float variable assignment", () => {
			const bytecode = CppParser.cppToByte("float myFloat = 3.14;")

			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			// Float parsing is more complex, so we just verify it's a valid bytecode
			expect(bytecode.length).toBeGreaterThan(10)
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
		})

		test("should parse set_all_leds_to_color command", () => {
			const bytecode = CppParser.cppToByte("set_all_leds_to_color(255, 127, 64);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(255) // R
			expect(bytecode[2]).toBe(127) // G
			expect(bytecode[3]).toBe(64)  // B
		})

		test("should parse individual LED setting", () => {
			const bytecode = CppParser.cppToByte("rgbLed.set_top_left_led(10, 20, 30);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			expect(bytecode[1]).toBe(LedID.TOP_LEFT)
			expect(bytecode[2]).toBe(10) // R
			expect(bytecode[3]).toBe(20) // G
			expect(bytecode[4]).toBe(30) // B
		})

		describe("Individual LED operations", () => {
			test("should parse set_top_right_led command", () => {
			  const bytecode = CppParser.cppToByte("rgbLed.set_top_right_led(10, 20, 30);")

			  expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			  expect(bytecode[1]).toBe(LedID.TOP_RIGHT)
			  expect(bytecode[2]).toBe(10) // R
			  expect(bytecode[3]).toBe(20) // G
			  expect(bytecode[4]).toBe(30) // B
			})

			test("should parse set_middle_left_led command", () => {
			  const bytecode = CppParser.cppToByte("rgbLed.set_middle_left_led(40, 50, 60);")

			  expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			  expect(bytecode[1]).toBe(LedID.MIDDLE_LEFT)
			  expect(bytecode[2]).toBe(40) // R
			  expect(bytecode[3]).toBe(50) // G
			  expect(bytecode[4]).toBe(60) // B
			})

			test("should parse set_middle_right_led command", () => {
			  const bytecode = CppParser.cppToByte("rgbLed.set_middle_right_led(70, 80, 90);")

			  expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			  expect(bytecode[1]).toBe(LedID.MIDDLE_RIGHT)
			  expect(bytecode[2]).toBe(70) // R
			  expect(bytecode[3]).toBe(80) // G
			  expect(bytecode[4]).toBe(90) // B
			})

			test("should parse set_back_left_led command", () => {
			  const bytecode = CppParser.cppToByte("rgbLed.set_back_left_led(100, 110, 120);")

			  expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			  expect(bytecode[1]).toBe(LedID.BACK_LEFT)
			  expect(bytecode[2]).toBe(100) // R
			  expect(bytecode[3]).toBe(110) // G
			  expect(bytecode[4]).toBe(120) // B
			})

			test("should parse set_back_right_led command", () => {
			  const bytecode = CppParser.cppToByte("rgbLed.set_back_right_led(130, 140, 150);")

			  expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			  expect(bytecode[1]).toBe(LedID.BACK_RIGHT)
			  expect(bytecode[2]).toBe(130) // R
			  expect(bytecode[3]).toBe(140) // G
			  expect(bytecode[4]).toBe(150) // B
			})
		  })

	})

	// 2.3 Test delay commands
	describe("Delay commands", () => {
		test("should parse delay command", () => {
			const bytecode = CppParser.cppToByte("delay(500);")

			expect(bytecode[0]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[1]).toBe(500 & 0xFF) // Low byte
			expect(bytecode[2]).toBe((500 >> 8) & 0xFF) // High byte
		})
	})

	// 3. Test complex programs (will need to be added once implemented)
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

			// 2nd instruction: DELAY
			expect(bytecode[5]).toBe(BytecodeOpCode.DELAY)

			// 3rd instruction: SET_ALL_LEDS (off)
			expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)

			// 4th instruction: DELAY
			expect(bytecode[15]).toBe(BytecodeOpCode.DELAY)

			// Last instruction should be END
			const lastIndex = bytecode.length - 5
			expect(bytecode[lastIndex]).toBe(BytecodeOpCode.END)
		})
	})
	// TODO: Add some conditional tests
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
	  expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
	  expect(bytecode[2]).toBe(5)  // Left value
	  expect(bytecode[3]).toBe(10) // Right value

	  // 2. Jump if false to else block
	  expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

	  // 3. Set LEDs white (true branch)
	  expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
	  expect(bytecode[11]).toBe(255) // R
	  expect(bytecode[12]).toBe(255) // G
	  expect(bytecode[13]).toBe(255) // B

	  // 4. Unconditional jump to skip else block
	  expect(bytecode[15]).toBe(BytecodeOpCode.JUMP)

	  // 5. Set LEDs red (false branch)
	  expect(bytecode[20]).toBe(BytecodeOpCode.SET_ALL_LEDS)
	  expect(bytecode[21]).toBe(255) // R
	  expect(bytecode[22]).toBe(0)   // G
	  expect(bytecode[23]).toBe(0)   // B

	  // 6. Delay instruction
	  expect(bytecode[25]).toBe(BytecodeOpCode.DELAY)
	  // Verify 1000ms delay (232 + 3*256 = 1000)
	  expect(bytecode[26]).toBe(232)
	  expect(bytecode[27]).toBe(3)

	  // 7. Set LEDs green (after if-else)
	  expect(bytecode[30]).toBe(BytecodeOpCode.SET_ALL_LEDS)
	  expect(bytecode[31]).toBe(0)   // R
	  expect(bytecode[32]).toBe(255) // G
	  expect(bytecode[33]).toBe(0)   // B

	  // 8. End instruction
	  expect(bytecode[35]).toBe(BytecodeOpCode.END)
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
		expect(bytecode[2]).toBe(3)  // Left value
		expect(bytecode[3]).toBe(7)  // Right value

		// 2. Jump if false to skip if block
		expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

		// Find the blue LED instruction (should be in the if block)
		let blueInstIndex = -1
		for (let i = 10; i < bytecode.length; i += 5) {
		  if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
			  bytecode[i + 1] === 0 &&
			  bytecode[i + 2] === 0 &&
			  bytecode[i + 3] === 255) {
				blueInstIndex = i
				break
		  }
		}
		expect(blueInstIndex).toBeGreaterThan(0) // Should find blue instruction

		// Find the purple LED instruction (should be after if block)
		let purpleInstIndex = -1
		for (let i = blueInstIndex + 5; i < bytecode.length; i += 5) {
		  if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
			  bytecode[i + 1] === 255 &&
			  bytecode[i + 2] === 0 &&
			  bytecode[i + 3] === 255) {
				purpleInstIndex = i
				break
		  }
		}
		expect(purpleInstIndex).toBeGreaterThan(0) // Should find purple instruction

		// Verify END instruction
		const endIndex = bytecode.length - 5
		expect(bytecode[endIndex]).toBe(BytecodeOpCode.END)
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
	  expect(bytecode[2]).toBe(10)  // Left value
	  expect(bytecode[3]).toBe(10)  // Right value

	  // 2. Jump if false to outer else
	  expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

	  // 3. Second compare operation (inner if)
	  expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
	  expect(bytecode[11]).toBe(ComparisonOp.NOT_EQUAL)
	  expect(bytecode[12]).toBe(5)  // Left value
	  expect(bytecode[13]).toBe(5)  // Right value

	  // Verify the end has the END opcode
	  expect(bytecode[bytecode.length - 5]).toBe(BytecodeOpCode.END)
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
			expect(bytecode[1]).toBe(test.op)
	  }
	})

	describe("Control flow error handling", () => {
		// Testing a valid operator pattern that isn't supported in the switch statement
		test("should reject unsupported comparison operator", () => {
		  // The "=" operator should match the regex [<>=!][=]? but isn't handled in the switch
		  expect(() => {
				CppParser.cppToByte("if (5 = 10) { rgbLed.set_led_red(); }")
		  }).toThrow(/Unsupported operator/)
		})

		test("should reject invalid command for malformed if statement", () => {
		  expect(() => {
				CppParser.cppToByte("if (5 <> 10) { rgbLed.set_led_red(); }") // '<>' doesn't match pattern
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

		// Then set_led_red (SET_ALL_LEDS with red)
		expect(bytecode[5]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[6]).toBe(255) // R
		expect(bytecode[7]).toBe(0)   // G
		expect(bytecode[8]).toBe(0)   // B

		// Then delay
		expect(bytecode[10]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[11]).toBe(500 & 0xFF) // Low byte of 500
		expect(bytecode[12]).toBe((500 >> 8) & 0xFF) // High byte of 500

		// Find the WHILE_END instruction (should be before END)
		let whileEndIndex = -1
		for (let i = 0; i < bytecode.length - 5; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndex = i
				break
			}
		}
		expect(whileEndIndex).toBeGreaterThan(0) // Should find WHILE_END

		// Check if jump offset is correct
		const jumpOffset = bytecode[whileEndIndex + 1] |
						(bytecode[whileEndIndex + 2] << 8)
		expect(jumpOffset).toBe(15) // 3 instructions * 5 bytes

		// The very last instruction should be END
		const lastInstructionIndex = bytecode.length - 5
		expect(bytecode[lastInstructionIndex]).toBe(BytecodeOpCode.END)
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
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_START) {
				whileStartIndices.push(i)
			}
		}
		expect(whileStartIndices.length).toBe(2) // Should have two while loops

		// Find all WHILE_END opcodes
		const whileEndIndices = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndices.push(i)
			}
		}
		expect(whileEndIndices.length).toBe(2) // Should have two loop ends

		// Inner loop should end before outer loop
		expect(whileEndIndices[0]).toBeLessThan(whileEndIndices[1])

		// Check if inner loop's WHILE_END jumps to correct WHILE_START
		const innerJumpOffset = bytecode[whileEndIndices[0] + 1] |
						(bytecode[whileEndIndices[0] + 2] << 8)
		// Inner loop should jump back to inner WHILE_START
		const expectedInnerOffset = whileEndIndices[0] - whileStartIndices[1]
		expect(innerJumpOffset).toBe(expectedInnerOffset)

		// Check if outer loop's WHILE_END jumps to correct WHILE_START
		const outerJumpOffset = bytecode[whileEndIndices[1] + 1] |
						(bytecode[whileEndIndices[1] + 2] << 8)
		// Outer loop should jump back to outer WHILE_START
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

		// Then should be COMPARE opcode
		expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)

		// Find WHILE_END opcode
		let whileEndIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndex = i
				break
			}
		}
		expect(whileEndIndex).toBeGreaterThan(0) // Should find WHILE_END

		// Verify WHILE_END jumps back to WHILE_START
		const jumpOffset = bytecode[whileEndIndex + 1] | (bytecode[whileEndIndex + 2] << 8)
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
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_START) {
				whileStartIndices.push(i)
			}
		}
		expect(whileStartIndices.length).toBe(2) // Should have two loop starts

		// Find all WHILE_END opcodes
		const whileEndIndices = []
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndices.push(i)
			}
		}
		expect(whileEndIndices.length).toBe(2) // Should have two loop ends

		// First loop's WHILE_END should jump to first WHILE_START
		const firstJumpOffset = bytecode[whileEndIndices[0] + 1] |
						(bytecode[whileEndIndices[0] + 2] << 8)
		const expectedFirstOffset = whileEndIndices[0] - whileStartIndices[0]
		expect(firstJumpOffset).toBe(expectedFirstOffset)

		// Second loop's WHILE_END should jump to second WHILE_START
		const secondJumpOffset = bytecode[whileEndIndices[1] + 1] |
						(bytecode[whileEndIndices[1] + 2] << 8)
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
		expect(bytecode[5]).toBe(BytecodeOpCode.WHILE_END)

		// Jump offset should be 5 bytes (just one instruction)
		expect(bytecode[6]).toBe(5)
		expect(bytecode[7]).toBe(0)
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
		for (let i = 0; i < bytecode.length - 5; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				whileEndIndex = i
				break
			}
		}
		expect(whileEndIndex).toBeGreaterThan(0) // Should find WHILE_END

		// The very last instruction should be END
		const lastInstructionIndex = bytecode.length - 5
		expect(bytecode[lastInstructionIndex]).toBe(BytecodeOpCode.END)
	})
})
