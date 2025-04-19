/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
import CppParser from "../../../../src/classes/cpp-parser"
import { MAX_LED_BRIGHTNESS } from "../../../../src/utils/constants"
import { BytecodeOpCode, CommandType, ComparisonOp, LedID, SensorType, VarType } from "../../../../src/types/bytecode-types"

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

describe("Variable in comparisons", () => {
	test("should throw error for undefined variable in if condition", () => {
		expect(() => {
			CppParser.cppToByte(`
        float myFloat = 1.5;
        if (undefinedVar > 0) {
          rgbLed.set_led_red();
        }
      `)
		}).toThrow(/Undefined variable or invalid number: undefinedVar/)
	})

	test("should throw error for undefined variable on right side of comparison", () => {
		expect(() => {
			CppParser.cppToByte(`
        float myFloat = 1.5;
        if (2 > undefinedVar) {
          rgbLed.set_led_red();
        }
      `)
		}).toThrow(/Undefined variable or invalid number: undefinedVar/)
	})

	test("should correctly handle defined variables in comparisons", () => {
		const bytecode = CppParser.cppToByte(`
      float myFloat = 1.5;
      if (myFloat > 0) {
        rgbLed.set_led_red();
      } else {
        rgbLed.set_led_green();
      }
    `)

		// Verify the bytecode correctly uses register reference
		// First instruction: DECLARE_VAR
		expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)

		// COMPARE instruction should use high bit for register reference
		let compareIndex = -1
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareIndex = i
				break
			}
		}

		expect(compareIndex).toBeGreaterThan(0)
		expect(bytecode[compareIndex + 1]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[compareIndex + 2]).toBe(0x8000) // Register 0 with high bit set
		expect(bytecode[compareIndex + 3]).toBe(0)      // Comparison with 0
	})

	test("should correctly handle variables from sensor readings in comparisons", () => {
		const bytecode = CppParser.cppToByte(`
      while(true) {
        float myFloat = Sensors::getInstance().getRoll();
        if (myFloat < -1.1) {
          rgbLed.set_led_red();
        } else {
          rgbLed.set_led_green();
        }
      }
    `)
		// Verify no NaN values in the bytecode
		for (let i = 0; i < bytecode.length; i++) {
			expect(Number.isNaN(bytecode[i])).toBe(false)
		}
	})

	test("should throw error for undefined variable with sensor reading", () => {
		expect(() => {
			CppParser.cppToByte(`
        while(true) {
          float myFloat = Sensors::getInstance().getRoll();
          if (myVar < -1.1) {  // myVar is undefined
            rgbLed.set_led_red();
          } else {
            rgbLed.set_led_green();
          }
        }
      `)
		}).toThrow(/Undefined variable or invalid number: myVar/)
	})
})

describe("Compound Conditional Statements", () => {
	describe("AND Operator (&&)", () => {

		test("should parse basic AND condition with simple comparisons", () => {
			const code = `
        if ((10 > 5) && (20 > 15)) {
          rgbLed.set_led_red();
        } else {
          rgbLed.set_led_green();
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Verify first comparison
			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[2]).toBe(10)
			expect(bytecode[3]).toBe(5)

			// Check for JUMP_IF_FALSE after first comparison (short-circuit)
			expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

			// Second comparison should exist
			let foundSecondCompare = false
			for (let i = 10; i < 20; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE &&
            bytecode[i + 1] === ComparisonOp.GREATER_THAN &&
            bytecode[i + 2] === 20 &&
            bytecode[i + 3] === 15) {
					foundSecondCompare = true
					break
				}
			}
			expect(foundSecondCompare).toBe(true)

			// Verify we have the right LED settings
			let redLEDIndex = -1
			let greenLEDIndex = -1

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					if (bytecode[i + 1] === MAX_LED_BRIGHTNESS && bytecode[i + 2] === 0 && bytecode[i + 3] === 0) {
						redLEDIndex = i
					} else if (bytecode[i + 1] === 0 && bytecode[i + 2] === MAX_LED_BRIGHTNESS && bytecode[i + 3] === 0) {
						greenLEDIndex = i
					}
				}
			}

			// Verify both LED settings were found and that red comes before green
			expect(redLEDIndex).toBeGreaterThan(0)
			expect(greenLEDIndex).toBeGreaterThan(0)
			expect(redLEDIndex).toBeLessThan(greenLEDIndex)
		})

		test("should handle compound AND with variables and sensor readings", () => {
			const code = `
        while(true) {
          float pitch = Sensors::getInstance().getPitch();
          float roll = Sensors::getInstance().getRoll();
          if ((pitch > 10) && (roll < -5)) {
            rgbLed.set_led_red();
          } else {
            rgbLed.set_led_blue();
          }
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Count READ_SENSOR instructions
			let sensorReadCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					sensorReadCount++
				}
			}

			// Should have at least 2 sensor reads
			expect(sensorReadCount).toBeGreaterThanOrEqual(2)

			// Verify we have COMPARE operations
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}

			// Should have at least 2 compares for the compound condition
			expect(compareCount).toBeGreaterThanOrEqual(2)

			// Verify we have a JUMP_IF_FALSE for short-circuit evaluation
			let jumpIfFalseCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				}
			}

			// Should have at least one JUMP_IF_FALSE
			expect(jumpIfFalseCount).toBeGreaterThanOrEqual(1)
		})

		test("should handle complex AND condition that evaluates to false", () => {
			const code = `
        if ((5 > 10) && (20 > 15)) {
          rgbLed.set_led_red();
        } else {
          rgbLed.set_led_green();
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Verify first comparison will be false
			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[2]).toBe(5)
			expect(bytecode[3]).toBe(10)

			// Check for JUMP_IF_FALSE after first comparison (short-circuit)
			expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

			// Find green LED instruction
			let greenLEDIndex = -1
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
            bytecode[i + 1] === 0 &&
            bytecode[i + 2] === MAX_LED_BRIGHTNESS &&
            bytecode[i + 3] === 0) {
					greenLEDIndex = i
					break
				}
			}

			expect(greenLEDIndex).toBeGreaterThan(0)
		})
	})

	describe("OR Operator (||)", () => {
		test("should parse basic OR condition with simple comparisons", () => {
			const code = `
        if ((10 > 5) || (20 < 15)) {
          rgbLed.set_led_red();
        } else {
          rgbLed.set_led_green();
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Verify first comparison
			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[2]).toBe(10)
			expect(bytecode[3]).toBe(5)

			// Check for JUMP_IF_TRUE after first comparison (short-circuit)
			expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_TRUE)

			// Second comparison should exist
			let foundSecondCompare = false
			for (let i = 10; i < 20; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE &&
            bytecode[i + 1] === ComparisonOp.LESS_THAN &&
            bytecode[i + 2] === 20 &&
            bytecode[i + 3] === 15) {
					foundSecondCompare = true
					break
				}
			}
			expect(foundSecondCompare).toBe(true)

			// Verify we find red LED instruction (condition evaluates to true)
			let redLEDFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
            bytecode[i + 1] === MAX_LED_BRIGHTNESS &&
            bytecode[i + 2] === 0 &&
            bytecode[i + 3] === 0) {
					redLEDFound = true
					break
				}
			}

			expect(redLEDFound).toBe(true)
		})

		test("should handle compound OR with variables and sensor readings", () => {
			const code = `
        while(true) {
          float pitch = Sensors::getInstance().getPitch();
          float roll = Sensors::getInstance().getRoll();
          if ((pitch > 30) || (roll < -45)) {
            rgbLed.set_led_purple();
          } else {
            rgbLed.set_led_white();
          }
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Count READ_SENSOR instructions
			let sensorReadCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					sensorReadCount++
				}
			}

			// Should have at least 2 sensor reads
			expect(sensorReadCount).toBeGreaterThanOrEqual(2)

			// Verify we have COMPARE operations
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}

			// Should have at least 2 compares for the compound condition
			expect(compareCount).toBeGreaterThanOrEqual(2)

			// Verify we have a JUMP_IF_TRUE for short-circuit evaluation
			let jumpIfTrueCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP_IF_TRUE) {
					jumpIfTrueCount++
				}
			}

			// Should have at least one JUMP_IF_TRUE
			expect(jumpIfTrueCount).toBeGreaterThanOrEqual(1)

			// Check for purple LED setting (true branch)
			let purpleLEDFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
            bytecode[i + 1] === MAX_LED_BRIGHTNESS &&
            bytecode[i + 2] === 0 &&
            bytecode[i + 3] === MAX_LED_BRIGHTNESS) {
					purpleLEDFound = true
					break
				}
			}

			expect(purpleLEDFound).toBe(true)
		})

		test("should handle complex OR condition where both sides evaluate to false", () => {
			const code = `
        if ((5 > 10) || (15 > 20)) {
          rgbLed.set_led_red();
        } else {
          rgbLed.set_led_green();
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Verify first comparison will be false
			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[2]).toBe(5)
			expect(bytecode[3]).toBe(10)

			// Check for JUMP_IF_TRUE after first comparison (short-circuit)
			expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_TRUE)

			// Verify second comparison will also be false
			let secondCompareIndex = -1
			for (let i = 10; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE &&
            bytecode[i + 1] === ComparisonOp.GREATER_THAN &&
            bytecode[i + 2] === 15 &&
            bytecode[i + 3] === 20) {
					secondCompareIndex = i
					break
				}
			}
			expect(secondCompareIndex).toBeGreaterThan(0)

			// Find green LED instruction (false branch)
			let greenLEDIndex = -1
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
            bytecode[i + 1] === 0 &&
            bytecode[i + 2] === MAX_LED_BRIGHTNESS &&
            bytecode[i + 3] === 0) {
					greenLEDIndex = i
					break
				}
			}

			expect(greenLEDIndex).toBeGreaterThan(0)
		})
	})

	describe("Complex Combinations", () => {
		test("should handle nested compound conditions in loops", () => {
			const code = `
        for (int i = 0; i < 5; i++) {
          if ((i > 2) && (i < 4)) {
            rgbLed.set_led_blue();
          } else {
            rgbLed.set_led_red();
          }
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Check for FOR_INIT, FOR_CONDITION, FOR_INCREMENT
			const forOpcodes = [BytecodeOpCode.FOR_INIT, BytecodeOpCode.FOR_CONDITION, BytecodeOpCode.FOR_INCREMENT]
			for (const opcode of forOpcodes) {
				let found = false
				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === opcode) {
						found = true
						break
					}
				}
				expect(found).toBe(true)
			}

			// Find the COMPARE instructions for the compound AND condition
			const compareIndices = []
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareIndices.push(i)
				}
			}

			// Should have at least 2 COMPARE operations (one for each condition in the AND)
			expect(compareIndices.length).toBeGreaterThanOrEqual(2)

			// Check for JUMP_IF_FALSE after first comparison (short-circuit)
			let foundJumpIfFalseAfterCompare = false
			for (let i = 0; i < compareIndices.length - 1; i++) {
				if (bytecode[compareIndices[i] + 5] === BytecodeOpCode.JUMP_IF_FALSE) {
					foundJumpIfFalseAfterCompare = true
					break
				}
			}
			expect(foundJumpIfFalseAfterCompare).toBe(true)

			// Verify both LED colors are present
			let blueLEDFound = false
			let redLEDFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					if (bytecode[i + 1] === 0 && bytecode[i + 2] === 0 && bytecode[i + 3] === MAX_LED_BRIGHTNESS) {
						blueLEDFound = true
					} else if (bytecode[i + 1] === MAX_LED_BRIGHTNESS && bytecode[i + 2] === 0 && bytecode[i + 3] === 0) {
						redLEDFound = true
					}
				}
			}

			expect(blueLEDFound).toBe(true)
			expect(redLEDFound).toBe(true)
		})

		test("should handle the example use case with roll and pitch sensor readings", () => {
			const code = `
        while(true) {
          float roll = Sensors::getInstance().getRoll();
          float pitch = Sensors::getInstance().getPitch();
          if ((roll > 0) && (pitch > 0)) {
            rgbLed.set_led_white();
          } else {
            rgbLed.set_led_green();
          }
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Verify we have READ_SENSOR instructions for roll and pitch
			let rollSensorFound = false
			let pitchSensorFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.ROLL) {
						rollSensorFound = true
					} else if (bytecode[i + 1] === SensorType.PITCH) {
						pitchSensorFound = true
					}
				}
			}

			expect(rollSensorFound).toBe(true)
			expect(pitchSensorFound).toBe(true)

			// Look for the two COMPARE instructions (one for roll, one for pitch)
			const compareIndices = []
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE && bytecode[i + 1] === ComparisonOp.GREATER_THAN) {
					compareIndices.push(i)
				}
			}

			// Should have at least 2 COMPARE operations (one for each condition in the AND)
			expect(compareIndices.length).toBeGreaterThanOrEqual(2)

			// Check for correct LED settings
			let whiteLEDFound = false
			let greenLEDFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					if (bytecode[i + 1] === MAX_LED_BRIGHTNESS &&
              bytecode[i + 2] === MAX_LED_BRIGHTNESS &&
              bytecode[i + 3] === MAX_LED_BRIGHTNESS) {
						whiteLEDFound = true
					} else if (bytecode[i + 1] === 0 &&
                     bytecode[i + 2] === MAX_LED_BRIGHTNESS &&
                     bytecode[i + 3] === 0) {
						greenLEDFound = true
					}
				}
			}

			expect(whiteLEDFound).toBe(true)
			expect(greenLEDFound).toBe(true)

			// Should find a WHILE_START and WHILE_END
			let whileStartFound = false
			let whileEndFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WHILE_START) {
					whileStartFound = true
				} else if (bytecode[i] === BytecodeOpCode.WHILE_END) {
					whileEndFound = true
				}
			}

			expect(whileStartFound).toBe(true)
			expect(whileEndFound).toBe(true)
		})
	})
})
