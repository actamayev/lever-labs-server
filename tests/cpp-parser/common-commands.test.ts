import { CppParser } from "@/parser/cpp-parser"
import { MAX_LED_BRIGHTNESS } from "@/utils/constants/constants"
import { BytecodeOpCode, ComparisonOp, SensorType, VarType } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

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
	})

	describe("Proximity Sensor Variable Assignments", () => {
		test("should parse boolean variable assignment with front proximity sensor", () => {
		  const bytecode = CppParser.cppToByte("bool isObjectInFront = front_distance_sensor.is_object_in_front();")

		  // First instruction: DECLARE_VAR
		  expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
		  expect(bytecode[1]).toBe(0)                        // register 0
		  expect(bytecode[2]).toBe(VarType.BOOL)             // boolean type
		  expect(bytecode[3]).toBe(0)                        // unused
		  expect(bytecode[4]).toBe(0)                        // unused

		  // Second instruction: READ_SENSOR (not SET_VAR)
		  expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
		  expect(bytecode[6]).toBe(SensorType.FRONT_PROXIMITY) // front proximity sensor
		  expect(bytecode[7]).toBe(0)                        // register 0
		  expect(bytecode[8]).toBe(0)                        // unused
		  expect(bytecode[9]).toBe(0)                        // unused

		  // Third instruction: END
		  expect(bytecode[10]).toBe(BytecodeOpCode.END)
		  expect(bytecode.length).toBe(15) // 3 instructions * 5
		})

		test("should parse boolean variable assignment with left proximity sensor", () => {
		  const bytecode = CppParser.cppToByte("bool isObjectOnLeft = left_distance_sensor.is_object_near();")

		  // First instruction: DECLARE_VAR
		  expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
		  expect(bytecode[1]).toBe(0)                        // register 0
		  expect(bytecode[2]).toBe(VarType.BOOL)             // boolean type

		  // Second instruction: READ_SENSOR
		  expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
		  expect(bytecode[6]).toBe(SensorType.SIDE_LEFT_PROXIMITY) // left proximity sensor
		  expect(bytecode[7]).toBe(0)                        // register 0
		})

		test("should parse boolean variable assignment with right proximity sensor", () => {
		  const bytecode = CppParser.cppToByte("bool isObjectOnRight = right_distance_sensor.is_object_near();")

		  // First instruction: DECLARE_VAR
		  expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
		  expect(bytecode[1]).toBe(0)                        // register 0
		  expect(bytecode[2]).toBe(VarType.BOOL)             // boolean type

		  // Second instruction: READ_SENSOR
		  expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
		  expect(bytecode[6]).toBe(SensorType.SIDE_RIGHT_PROXIMITY) // right proximity sensor
		  expect(bytecode[7]).toBe(0)                        // register 0
		})

		test("should handle multiple proximity sensor variables", () => {
		  const bytecode = CppParser.cppToByte(`
			bool front = front_distance_sensor.is_object_in_front();
			bool left = left_distance_sensor.is_object_near();
			bool right = right_distance_sensor.is_object_near();
		  `)

		  // Check for three DECLARE_VAR instructions
		  let declareVarCount = 0
		  for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR && bytecode[i + 2] === VarType.BOOL) {
			  declareVarCount++
				}
		  }
		  expect(declareVarCount).toBe(3)

		  // Check for all three proximity sensor types
		  let frontFound = false
		  let leftFound = false
		  let rightFound = false

		  for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
			  if (bytecode[i + 1] === SensorType.FRONT_PROXIMITY) {
						frontFound = true
			  } else if (bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) {
						leftFound = true
			  } else if (bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY) {
						rightFound = true
			  }
				}
		  }

		  expect(frontFound).toBe(true)
		  expect(leftFound).toBe(true)
		  expect(rightFound).toBe(true)
		})

		test("should throw error when assigning proximity sensor to non-boolean type", () => {
		  // Proximity sensors return boolean values, so they should only be assigned to boolean variables
		  expect(() => {
				CppParser.cppToByte("int wrongType = front_distance_sensor.is_object_in_front();")
		  }).toThrow() // This should throw some kind of error
		})

		test("should handle proximity sensor with conditional logic", () => {
		  const bytecode = CppParser.cppToByte(`
			bool frontObject = front_distance_sensor.is_object_in_front();
			if (frontObject) {
			  all_leds.set_color(RED);
			} else {
			  all_leds.set_color(GREEN);
			}
		  `)

		  // Check for DECLARE_VAR and READ_SENSOR
		  expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
		  expect(bytecode[2]).toBe(VarType.BOOL)
		  expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
		  expect(bytecode[6]).toBe(SensorType.FRONT_PROXIMITY)

		  // Should find COMPARE instruction that uses the variable
		  let compareFound = false
		  for (let i = 10; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
			  if (bytecode[i + 2] === 0x8000) { // Register 0 with high bit set
						compareFound = true
						break
			  }
				}
		  }
		  expect(compareFound).toBe(true)

		  // Should find both red and green LED instructions
		  let redLedFound = false
		  let greenLedFound = false
		  for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
			  if (bytecode[i + 1] === MAX_LED_BRIGHTNESS && bytecode[i + 2] === 0 && bytecode[i + 3] === 0) {
						redLedFound = true
			  } else if (bytecode[i + 1] === 0 && bytecode[i + 2] === MAX_LED_BRIGHTNESS && bytecode[i + 3] === 0) {
						greenLedFound = true
			  }
				}
		  }
		  expect(redLedFound).toBe(true)
		  expect(greenLedFound).toBe(true)
		})
	  })
})

// 2.2 Test LED operations
describe("LED operations", () => {
	test("should parse turn_led_off command", () => {
		const bytecode = CppParser.cppToByte("all_leds.set_color(OFF);")

		expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[1]).toBe(0) // R
		expect(bytecode[2]).toBe(0) // G
		expect(bytecode[3]).toBe(0) // B
		expect(bytecode[4]).toBe(0) // Unused
	})
})

// 2.3 Test wait commands
describe("Wait commands", () => {
	test("should parse wait command", () => {
		const bytecode = CppParser.cppToByte("wait(0.5);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBe(0.5) // Wait value
		expect(bytecode[2]).toBe(0)   // Unused
		expect(bytecode[3]).toBe(0)   // Unused
		expect(bytecode[4]).toBe(0)   // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should parse decimal wait command with one decimal place", () => {
		const bytecode = CppParser.cppToByte("wait(0.5);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBe(0.5) // Decimal wait value
		expect(bytecode[2]).toBe(0)   // Unused
		expect(bytecode[3]).toBe(0)   // Unused
		expect(bytecode[4]).toBe(0)   // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should parse decimal wait command with multiple decimal places", () => {
		const bytecode = CppParser.cppToByte("wait(1.234);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBeCloseTo(1.234, 2) // Decimal wait value
		expect(bytecode[2]).toBe(0)               // Unused
		expect(bytecode[3]).toBe(0)               // Unused
		expect(bytecode[4]).toBe(0)               // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should parse decimal wait command with many decimal places", () => {
		const bytecode = CppParser.cppToByte("wait(0.5123);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBeCloseTo(0.5123, 3) // Decimal value within precision
		expect(bytecode[2]).toBe(0)                // Unused
		expect(bytecode[3]).toBe(0)                // Unused
		expect(bytecode[4]).toBe(0)                // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should handle decimal wait with trailing zeros", () => {
		const bytecode = CppParser.cppToByte("wait(2.500);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBe(2.5)   // Should be 2.5, not 2.500
		expect(bytecode[2]).toBe(0)     // Unused
		expect(bytecode[3]).toBe(0)     // Unused
		expect(bytecode[4]).toBe(0)     // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should handle decimal wait starting with zero", () => {
		const bytecode = CppParser.cppToByte("wait(0.001);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBeCloseTo(0.001, 3) // Small decimal value
		expect(bytecode[2]).toBe(0)               // Unused
		expect(bytecode[3]).toBe(0)               // Unused
		expect(bytecode[4]).toBe(0)               // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should handle high precision decimal wait command", () => {
		const bytecode = CppParser.cppToByte("wait(0.89999);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBeCloseTo(0.89999, 3) // High precision decimal value
		expect(bytecode[2]).toBe(0)                 // Unused
		expect(bytecode[3]).toBe(0)                 // Unused
		expect(bytecode[4]).toBe(0)                 // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should handle long decimal wait command", () => {
		const bytecode = CppParser.cppToByte("wait(1.2345);")

		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[1]).toBeCloseTo(1.2345, 3) // Long decimal value
		expect(bytecode[2]).toBe(0)                // Unused
		expect(bytecode[3]).toBe(0)                // Unused
		expect(bytecode[4]).toBe(0)                // Unused
		expect(bytecode[5]).toBe(BytecodeOpCode.END)
	})

	test("should handle complex decimal wait program", () => {
		const program = `
			left_button.wait_for_press();
			while(true) {
				all_leds.set_color(WHITE);
				wait(0.9);
				all_leds.set_color(RED);
				wait(0.9);
				all_leds.set_color(GREEN);
				wait(0.9);
			}

		`
		const bytecode = CppParser.cppToByte(program)

		// First instruction: WAIT_FOR_BUTTON
		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT_FOR_BUTTON)

		// Second instruction: WHILE_START
		expect(bytecode[5]).toBe(BytecodeOpCode.WHILE_START)

		// Third instruction: SET_ALL_LEDS (white)
		expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[11]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[12]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[13]).toBe(MAX_LED_BRIGHTNESS) // B

		// Fourth instruction: WAIT with decimal 0.9
		expect(bytecode[15]).toBe(BytecodeOpCode.WAIT)

		// Check the wait value is 0.9
		expect(bytecode[16]).toBeCloseTo(0.9, 2) // Should be close to 0.9

		// Look for additional wait instructions with the same value
		let waitCount = 0
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.WAIT) {
				expect(bytecode[i + 1]).toBeCloseTo(0.9, 2)
				waitCount++
			}
		}
		expect(waitCount).toBe(3) // Should have 3 wait(0.9) instructions
	})
})

describe("Combining multiple commands", () => {
	test("should parse a simple LED blink program", () => {
		const program = `
			all_leds.set_color(RED);
			wait(0.5);
			all_leds.set_color(OFF);
			wait(0.5);
		`

		const bytecode = CppParser.cppToByte(program)

		// 1st instruction: SET_ALL_LEDS (red)
		expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[1]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[2]).toBe(0)   // G
		expect(bytecode[3]).toBe(0)   // B

		// 2nd instruction: WAIT
		expect(bytecode[5]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[6]).toBe(0.5)

		// 3rd instruction: SET_ALL_LEDS (off)
		expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[11]).toBe(0) // R
		expect(bytecode[12]).toBe(0) // G
		expect(bytecode[13]).toBe(0) // B

		// 4th instruction: WAIT
		expect(bytecode[15]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[16]).toBe(0.5)

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
          all_leds.set_color(RED);
        }
      `)
		}).toThrow(/Undefined variable or invalid number: undefinedVar/)
	})

	test("should throw error for undefined variable on right side of comparison", () => {
		expect(() => {
			CppParser.cppToByte(`
        float myFloat = 1.5;
        if (2 > undefinedVar) {
          all_leds.set_color(RED);
        }
      `)
		}).toThrow(/Undefined variable or invalid number: undefinedVar/)
	})

	test("should correctly handle defined variables in comparisons", () => {
		const bytecode = CppParser.cppToByte(`
      float myFloat = 1.5;
      if (myFloat > 0) {
        all_leds.set_color(RED);
      } else {
        all_leds.set_color(GREEN);
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
        float myFloat = imu.getRoll();
        if (myFloat < -1.1) {
          all_leds.set_color(RED);
        } else {
          all_leds.set_color(GREEN);
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
          float myFloat = imu.getRoll();
          if (myVar < -1.1) {  // myVar is undefined
            all_leds.set_color(RED);
          } else {
            all_leds.set_color(GREEN);
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
          all_leds.set_color(RED);
        } else {
          all_leds.set_color(GREEN);
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
          float pitch = imu.getPitch();
          float roll = imu.getRoll();
          if ((pitch > 10) && (roll < -5)) {
            all_leds.set_color(RED);
          } else {
            all_leds.set_color(BLUE);
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
          all_leds.set_color(RED);
        } else {
          all_leds.set_color(GREEN);
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
          all_leds.set_color(RED);
        } else {
          all_leds.set_color(GREEN);
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
          float pitch = imu.getPitch();
          float roll = imu.getRoll();
          if ((pitch > 30) || (roll < -45)) {
            all_leds.set_color(PURPLE);
          } else {
            all_leds.set_color(WHITE);
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
          all_leds.set_color(RED);
        } else {
          all_leds.set_color(GREEN);
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
            all_leds.set_color(BLUE);
          } else {
            all_leds.set_color(RED);
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
			const compareIndices: number[] = []
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
          float roll = imu.getRoll();
          float pitch = imu.getPitch();
          if ((roll > 0) && (pitch > 0)) {
            all_leds.set_color(WHITE);
          } else {
            all_leds.set_color(GREEN);
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
			const compareIndices: number[] = []
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
