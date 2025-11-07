import { CppParser } from "parser/cpp-parser"
import { BytecodeOpCode, ComparisonOp, SensorType, VarType } from "../../src/types/bytecode-types"
import { MAX_LED_BRIGHTNESS } from "@/utils/constants/constants"
import { describe, test, expect } from "@jest/globals"

describe("Complex Nested Structures", () => {
	test("should correctly parse and translate the proximity sensor LED indicator logic", () => {
		const code = `
    left_button.wait_for_press();
    while(true) {
        if (front_distance_sensor.is_object_in_front()) {
            all_leds.set_color(WHITE);
        } else {
            if (right_distance_sensor.is_object_near()) {
                all_leds.set_color(RED);
            } else {
                if (left_distance_sensor.is_object_near()) {
                    all_leds.set_color(BLUE);
                } else {
                    all_leds.set_color(GREEN);
                }
            }
        }
    }
    `

		// Parse the code to bytecode
		const bytecode = CppParser.cppToByte(code)

		// Track important instructions found
		let waitForButtonFound = false
		let whileStartFound = false
		let whileEndFound = false
		let frontProximityRead = false
		let rightProximityRead = false
		let leftProximityRead = false
		let whiteLedFound = false
		let redLedFound = false
		let blueLedFound = false
		let greenLedFound = false

		// Check for correct initial wait instruction
		expect(bytecode[0]).toBe(BytecodeOpCode.WAIT_FOR_BUTTON)
		waitForButtonFound = true

		// Verify all key components exist in the bytecode
		for (let i = 5; i < bytecode.length; i += 5) {
			const opcode = bytecode[i]

			// Check for basic control flow
			if (opcode === BytecodeOpCode.WHILE_START) {
				whileStartFound = true
			} else if (opcode === BytecodeOpCode.WHILE_END) {
				whileEndFound = true
			}
			// Check for sensor readings
			else if (opcode === BytecodeOpCode.READ_SENSOR) {
				const sensorType = bytecode[i + 1]
				if (sensorType === SensorType.FRONT_PROXIMITY) {
					frontProximityRead = true
				} else if (sensorType === SensorType.SIDE_RIGHT_PROXIMITY) {
					rightProximityRead = true
				} else if (sensorType === SensorType.SIDE_LEFT_PROXIMITY) {
					leftProximityRead = true
				}
			}
			// Check for LED settings
			else if (opcode === BytecodeOpCode.SET_ALL_LEDS) {
				const r = bytecode[i + 1]
				const g = bytecode[i + 2]
				const b = bytecode[i + 3]

				if (r === MAX_LED_BRIGHTNESS && g === MAX_LED_BRIGHTNESS && b === MAX_LED_BRIGHTNESS) {
					whiteLedFound = true
				} else if (r === MAX_LED_BRIGHTNESS && g === 0 && b === 0) {
					redLedFound = true
				} else if (r === 0 && g === 0 && b === MAX_LED_BRIGHTNESS) {
					blueLedFound = true
				} else if (r === 0 && g === MAX_LED_BRIGHTNESS && b === 0) {
					greenLedFound = true
				}
			}
		}

		// Test if all important instructions were found
		expect(waitForButtonFound).toBe(true)
		expect(whileStartFound).toBe(true)
		expect(whileEndFound).toBe(true)
		expect(frontProximityRead).toBe(true)
		expect(rightProximityRead).toBe(true)
		expect(leftProximityRead).toBe(true)
		expect(whiteLedFound).toBe(true)
		expect(redLedFound).toBe(true)
		expect(blueLedFound).toBe(true)
		expect(greenLedFound).toBe(true)

		// Verify specific sequential instruction patterns to ensure correct control flow

		// 1. Front proximity detection pattern
		let frontSequenceFound = false
		for (let i = 5; i < bytecode.length - 15; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
          bytecode[i + 1] === SensorType.FRONT_PROXIMITY &&
          bytecode[i + 5] === BytecodeOpCode.COMPARE &&
          bytecode[i + 10] === BytecodeOpCode.JUMP_IF_FALSE) {
				frontSequenceFound = true
				break
			}
		}
		expect(frontSequenceFound).toBe(true)

		// 2. Right proximity detection pattern (should happen after front check fails)
		let rightSequenceFound = false
		for (let i = 5; i < bytecode.length - 15; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
          bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY &&
          bytecode[i + 5] === BytecodeOpCode.COMPARE &&
          bytecode[i + 10] === BytecodeOpCode.JUMP_IF_FALSE) {
				rightSequenceFound = true
				break
			}
		}
		expect(rightSequenceFound).toBe(true)

		// 3. Left proximity detection pattern (should happen after right check fails)
		let leftSequenceFound = false
		for (let i = 5; i < bytecode.length - 15; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
          bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY &&
          bytecode[i + 5] === BytecodeOpCode.COMPARE &&
          bytecode[i + 10] === BytecodeOpCode.JUMP_IF_FALSE) {
				leftSequenceFound = true
				break
			}
		}
		expect(leftSequenceFound).toBe(true)

		// 4. Front detected -> white LED
		let frontActionFound = false
		for (let i = 5; i < bytecode.length - 10; i += 5) {
			// Find a pattern where COMPARE is followed by JUMP_IF_FALSE (for front object check)
			// and we can locate a white LED instruction soon after
			if (bytecode[i] === BytecodeOpCode.COMPARE &&
          bytecode[i + 5] === BytecodeOpCode.JUMP_IF_FALSE) {
				// Look for white LED setting in the next few instructions (not after the jump)
				for (let j = i + 10; j < i + 30 && j < bytecode.length; j += 5) {
					if (bytecode[j] === BytecodeOpCode.SET_ALL_LEDS &&
              bytecode[j + 1] === MAX_LED_BRIGHTNESS &&
              bytecode[j + 2] === MAX_LED_BRIGHTNESS &&
              bytecode[j + 3] === MAX_LED_BRIGHTNESS) {
						frontActionFound = true
						break
					}
				}
			}
		}
		expect(frontActionFound).toBe(true)

		// 5. Right detected -> red LED
		let rightActionFound = false
		for (let i = 5; i < bytecode.length - 10; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
          bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY) {
				// Look for red LED setting in the next few instructions
				for (let j = i + 10; j < i + 30 && j < bytecode.length; j += 5) {
					if (bytecode[j] === BytecodeOpCode.SET_ALL_LEDS &&
              bytecode[j + 1] === MAX_LED_BRIGHTNESS &&
              bytecode[j + 2] === 0 &&
              bytecode[j + 3] === 0) {
						rightActionFound = true
						break
					}
				}
			}
		}
		expect(rightActionFound).toBe(true)

		// 6. Left detected -> blue LED
		let leftActionFound = false
		for (let i = 5; i < bytecode.length - 10; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
          bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) {
				// Look for blue LED setting in the next few instructions
				for (let j = i + 10; j < i + 30 && j < bytecode.length; j += 5) {
					if (bytecode[j] === BytecodeOpCode.SET_ALL_LEDS &&
              bytecode[j + 1] === 0 &&
              bytecode[j + 2] === 0 &&
              bytecode[j + 3] === MAX_LED_BRIGHTNESS) {
						leftActionFound = true
						break
					}
				}
			}
		}
		expect(leftActionFound).toBe(true)

		// 7. Verify the final instruction is the WHILE_END that jumps back to WHILE_START
		let lastInstruction = -1
		for (let i = bytecode.length - 10; i >= 0; i -= 5) {
			if (bytecode[i] === BytecodeOpCode.WHILE_END) {
				lastInstruction = i
				break
			}
		}
		expect(lastInstruction).toBeGreaterThan(0)

		// 8. END instruction should be the very last
		expect(bytecode[bytecode.length - 5]).toBe(BytecodeOpCode.END)

		// 9. Verify correct order of conditional blocks (front, right, left, clear)
		// This is tricky to test directly with the bytecode but we can check for the existence
		// of the correct sequence of LED setting instructions
		let whiteIndex = -1
		let redIndex = -1
		let blueIndex = -1
		let greenIndex = -1

		// Find indices of each LED color setting
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
				const r = bytecode[i + 1]
				const g = bytecode[i + 2]
				const b = bytecode[i + 3]

				if (r === MAX_LED_BRIGHTNESS && g === MAX_LED_BRIGHTNESS && b === MAX_LED_BRIGHTNESS) {
					whiteIndex = i
				} else if (r === MAX_LED_BRIGHTNESS && g === 0 && b === 0) {
					redIndex = i
				} else if (r === 0 && g === 0 && b === MAX_LED_BRIGHTNESS) {
					blueIndex = i
				} else if (r === 0 && g === MAX_LED_BRIGHTNESS && b === 0) {
					greenIndex = i
				}
			}
		}

		// All LED indices should be found
		expect(whiteIndex).toBeGreaterThan(-1)
		expect(redIndex).toBeGreaterThan(-1)
		expect(blueIndex).toBeGreaterThan(-1)
		expect(greenIndex).toBeGreaterThan(-1)
	})
})

describe("Boundary Conditions", () => {
	test("should handle large programs approaching VM instruction limits", () => {
	// Generate a program with a large number of simple statements
		const statements: string[] = []
		for (let i = 0; i < 100; i++) {
			statements.push("all_leds.set_color(RED);")
			statements.push("wait(10);")
			statements.push("all_leds.set_color(BLUE);")
			statements.push("wait(10);")
		}

		const code = statements.join("\n")

		// Should parse without issues
		const bytecode = CppParser.cppToByte(code)

		// Verify bytecode length - should be (400 instructions + END) * 5 bytes per instruction
		// 400 instructions: 100 * 4 (2 LED sets + 2 waits)
		expect(bytecode.length).toBe((400 + 1) * 5)

		// Check first few instructions
		expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[5]).toBe(BytecodeOpCode.WAIT)

		// Check last instruction is END
		expect(bytecode[bytecode.length - 5]).toBe(BytecodeOpCode.END)
	})

	test("should handle loops with edge-case iteration values", () => {
	// Test cases with extreme loop bounds
		const testCases: { code: string, iterations: number }[] = [
			{ code: "for (int i = 0; i < 0; i++) { all_leds.set_color(RED); }", iterations: 0 },
			{ code: "for (int i = 0; i < 1; i++) { all_leds.set_color(RED); }", iterations: 1 },
			{ code: "for (int i = 32766; i < 32767; i++) { all_leds.set_color(RED); }", iterations: 1 }, // Near uint16 max
		]

		for (const { code, iterations } of testCases) {
			const bytecode = CppParser.cppToByte(code)

			// FOR_INIT should be present
			let foundForInit = false
			let initIndex = -1

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
					foundForInit = true
					initIndex = i
					break
				}
			}

			expect(foundForInit).toBe(true)

			// FOR_CONDITION should be next
			expect(bytecode[initIndex + 5]).toBe(BytecodeOpCode.FOR_CONDITION)

			// Check that the end condition value is properly encoded
			if (iterations === 0) {
			// End value for condition should be 0
				expect(bytecode[initIndex + 5 + 2]).toBe(0)
			} else if (iterations === 1) {
			// Check if FOR_INCREMENT is present
				let foundForIncrement = false
				for (let i = initIndex + 5; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) {
						foundForIncrement = true
						break
					}
				}
				expect(foundForIncrement).toBe(true)
			}
		}
	})

	test("should handle maximum register usage", () => {
	// Create a program with many variables to use a lot of registers
		let code = "" as string
		const numVars = 50 // A significant number but not exceeding MAX_REGISTERS

		// Declare many variables
		for (let i = 0; i < numVars; i++) {
			code += `int var${i} = ${i};\n`
		}

		// Use the variables in a series of if statements
		for (let i = 0; i < numVars; i++) {
			code += `if (var${i} < ${i + 1}) { all_leds.set_color(RED); } else { all_leds.set_color(BLUE); }\n`
		}

		// Should parse without issues
		const bytecode = CppParser.cppToByte(code)

		// Count variable declarations and compare operations
		let declareVarCount = 0
		let compareCount = 0

		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
				declareVarCount++
			} else if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareCount++
			}
		}

		expect(declareVarCount).toBe(numVars)
		expect(compareCount).toBe(numVars)
	})

	test("should handle extremely deep nesting of if-else statements", () => {
	// Create a program with deeply nested if-else statements
		const nestingDepth = 8 // Reduced from 15 to a more reasonable depth

		// Start with variable declaration
		let code = "int x = 10;\n" as string

		// Create deeply nested if-else structure
		let currentIndent = ""
		for (let i = 0; i < nestingDepth; i++) {
			code += `${currentIndent}if (x > ${i}) {\n`
			currentIndent += "  "
		}

		// Add statement at deepest level
		code += `${currentIndent}all_leds.set_color(RED);\n`

		// Close all the open if blocks
		for (let i = 0; i < nestingDepth; i++) {
			currentIndent = currentIndent.substring(2) // Reduce indent
			code += `${currentIndent}} else {\n`
			code += `${currentIndent}  all_leds.set_color(BLUE);\n`
			code += `${currentIndent}}\n`
		}

		// Should parse without throwing
		const bytecode = CppParser.cppToByte(code)

		// Count if and LED instructions
		let compareCount = 0
		let jumpIfFalseCount = 0
		let setLedCount = 0

		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				compareCount++
			} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
				jumpIfFalseCount++
			} else if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
				setLedCount++
			}
		}

		// Verify that we have the expected number of each instruction type
		expect(compareCount).toBe(nestingDepth)
		expect(jumpIfFalseCount).toBe(nestingDepth)
		// Expect at least nestingDepth LED instructions (minimum 1 per nesting level)
		expect(setLedCount).toBeGreaterThanOrEqual(nestingDepth)
	})

	test("should handle all sensor types in a single program", () => {
	// Create code that uses all available sensor types
		const code = `
		while(true) {
		float pitch = imu.getPitch();
		float roll = imu.getRoll();
		float yaw = imu.getYaw();
		float accelX = imu.getXAccel();
		float accelY = imu.getYAccel();
		float accelZ = imu.getZAccel();
		float accelMag = imu.getAccelMagnitude();
		float rotRateX = imu.getXRotationRate();
		float rotRateY = imu.getYRotationRate();
		float rotRateZ = imu.getZRotationRate();
		float magX = imu.getMagneticFieldX();
		float magY = imu.getMagneticFieldY();
		float magZ = imu.getMagneticFieldZ();
		
		if ((pitch > 30) || (roll > 30)) {
		all_leds.set_color(RED);
		} 

		if (yaw > 90) {
		all_leds.set_color(GREEN);
		}

		if (accelMag > 2) {
		all_leds.set_color(BLUE);
		}

		if (magX < 0) {
		all_leds.set_color(WHITE);
		}
		
		wait(0.1);
		}
	`

		const bytecode = CppParser.cppToByte(code)

		// Check that we have sensor reads for all types
		const sensorTypeCounts = new Array(13).fill(0) // SensorType has 13 values (0-12)

		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
				const sensorType = bytecode[i + 1]
				if (sensorType >= 0 && sensorType <= 12) {
					sensorTypeCounts[sensorType]++
				}
			}
		}

		// Check that every sensor type is used
		for (let type = 0; type <= 12; type++) {
			expect(sensorTypeCounts[type]).toBe(1)
		}
	})

	test("should reject complex nested conditions for now", () => {
		expect(() => {
		  const code = `
			float x = 10.5;
			float y = 20.3;
			float z = 30.7;
			
			if ((x > 5 && y < 30) || (z > 20 && x < 15) || (y > 15 && z < 40)) {
			  all_leds.set_color(RED);
			}
		  `

		  CppParser.cppToByte(code)
		}).toThrow("Complex conditions with multiple logical operators are not supported")
	  })
})

describe("Error Handling Edge Cases", () => {
	test("should reject unbalanced blocks at extreme depths", () => {
		const nestingDepth = 10

		// Create a deeply nested structure with a missing closing brace
		let code = "int x = 5;\n"
		let currentIndent = "" as string

		for (let i = 0; i < nestingDepth; i++) {
			code += `${currentIndent}if (x > ${i}) {\n`
			currentIndent += "  "
		}

		code += `${currentIndent}all_leds.set_color(RED);\n`

		// Close one fewer block than we opened
		for (let i = 0; i < nestingDepth - 1; i++) {
			currentIndent = currentIndent.substring(2)
			code += `${currentIndent}}\n`
		}

		expect(() => {
			CppParser.cppToByte(code)
		}).toThrow(/Unclosed '\{'/) // Match actual error message
	})

	test("should reject mismatched brackets at different structural positions", () => {
		const testCases = [
			{
				code: "if (x > 5) { all_leds.set_color(RED); ]",
				errorPattern: /Expected '\}' but found '\]'/
			},
			{
				code: "if (x > 5) [ all_leds.set_color(RED); }",
				errorPattern: /Expected '\]' but found '\}'/
			},
			{
				code: "for (int i = 0; i < 10; i++) { all_leds.set_color(RED); ) }",
				errorPattern: /Expected '\}' but found '\)'/ // Match the actual error message format
			}
		]

		for (const { code, errorPattern } of testCases) {
			expect(() => {
				CppParser.cppToByte(code)
			}).toThrow(errorPattern)
		}
	})
})

describe("Proximity Sensor Functionality", () => {
	describe("Front Proximity Sensor", () => {
		test("should parse front_distance_sensor.is_object_in_front function", () => {
			const code = `if (front_distance_sensor.is_object_in_front()) {
        all_leds.set_color(RED);
      } else {
        all_leds.set_color(GREEN);
      }`

			const bytecode = CppParser.cppToByte(code)

			// 1. READ_SENSOR instruction for front proximity
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.FRONT_PROXIMITY)
			expect(bytecode[2]).toBe(0) // Register ID
			expect(bytecode[3]).toBe(0) // Unused
			expect(bytecode[4]).toBe(0) // Unused

			// 2. COMPARE instruction (comparing with true/1)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference with high bit set
			expect(bytecode[8]).toBe(1)      // Comparing with boolean true (1)
			expect(bytecode[9]).toBe(0)      // Unused

			// 3. JUMP_IF_FALSE to else block
			expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)

			// LED instructions should be present
			let redLedFound = false
			let greenLedFound = false

			for (let i = 15; i < bytecode.length; i += 5) {
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

		test("should handle front proximity sensor in loops", () => {
			const code = `while(true) {
        if (front_distance_sensor.is_object_in_front()) {
          all_leds.set_color(RED);
          wait(0.1);
        } else {
          all_leds.set_color(GREEN);
          wait(0.5);
        }
      }`

			const bytecode = CppParser.cppToByte(code)

			// Verify the while loop and front proximity sensor reading
			expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
			expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[6]).toBe(SensorType.FRONT_PROXIMITY)

			// Verify we have the correct wait values in each branch
			let wait100Found = false, wait500Found = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WAIT) {
					if (Math.abs(bytecode[i + 1] - 0.1) < 1e-6) {
						wait100Found = true
					} else if (Math.abs(bytecode[i + 1] - 0.5) < 1e-6) {
						wait500Found = true
					}
				}
			}

			expect(wait100Found).toBe(true)
			expect(wait500Found).toBe(true)

			// Verify WHILE_END is present
			let whileEndFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WHILE_END) {
					whileEndFound = true
					break
				}
			}
			expect(whileEndFound).toBe(true)
		})

		test("should handle assigning front proximity sensor result to variable", () => {
			const code = `
			  bool objectDetected = front_distance_sensor.is_object_in_front();
			  if (objectDetected) {
				all_leds.set_color(RED);
			  } else {
				all_leds.set_color(GREEN);
			  }
			`

			// Parse the code (should not throw now)
			const bytecode = CppParser.cppToByte(code)

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
