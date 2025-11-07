import { CppParser } from "../../src/parser/cpp-parser"
import { BytecodeOpCode, SensorType } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"
import { MAX_LED_BRIGHTNESS } from "../../src/utils/constants/constants"

describe("Proximity Sensor Functions", () => {
	describe("Side Proximity Detection", () => {
		test("should parse standalone left proximity detection function", () => {
			const code = "left_distance_sensor.is_object_near();"
			const bytecode = CppParser.cppToByte(code)

			// Should generate a READ_SENSOR instruction for left proximity
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.SIDE_LEFT_PROXIMITY)
			expect(bytecode[2]).toBe(0) // Register ID
			expect(bytecode[3]).toBe(0) // Unused
			expect(bytecode[4]).toBe(0) // Unused

			// Should have END instruction
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should parse standalone right proximity detection function", () => {
			const code = "right_distance_sensor.is_object_near();"
			const bytecode = CppParser.cppToByte(code)

			// Should generate a READ_SENSOR instruction for right proximity
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.SIDE_RIGHT_PROXIMITY)
			expect(bytecode[2]).toBe(0) // Register ID
			expect(bytecode[3]).toBe(0) // Unused
			expect(bytecode[4]).toBe(0) // Unused

			// Should have END instruction
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should throw error when registers are exhausted", () => {
			// Create a function that will use up all registers
			const registerSetup = Array(512).fill(null).map((_, i) =>
				`float var${i} = 0.0;`
			).join("\n")

			const code = `
        ${registerSetup}
        left_distance_sensor.is_object_near();
      `

			// Should throw error about exceeding register count
			expect(() => {
				CppParser.cppToByte(code)
			}).toThrow(/exceeds maximum register count/)
		})

		test("should handle multiple side proximity sensors", () => {
			const code = `
        left_distance_sensor.is_object_near();
        wait(0.1);
        right_distance_sensor.is_object_near();
      `

			const bytecode = CppParser.cppToByte(code)

			// Should have both proximity sensor types
			let leftFound = false
			let rightFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) {
						leftFound = true
					} else if (bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY) {
						rightFound = true
					}
				}
			}

			expect(leftFound).toBe(true)
			expect(rightFound).toBe(true)
		})
	})

	describe("Front Proximity Detection", () => {
		test("should parse standalone front proximity detection function", () => {
			const code = "front_distance_sensor.is_object_in_front();"
			const bytecode = CppParser.cppToByte(code)

			// Should generate a READ_SENSOR instruction for front proximity
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.FRONT_PROXIMITY)
			expect(bytecode[2]).toBe(0) // Register ID
			expect(bytecode[3]).toBe(0) // Unused
			expect(bytecode[4]).toBe(0) // Unused

			// Should have END instruction
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should throw error when registers are exhausted", () => {
			// Create a function that will use up all registers
			const registerSetup = Array(512).fill(null).map((_, i) =>
				`float var${i} = 0.0;`
			).join("\n")

			const code = `
        ${registerSetup}
        front_distance_sensor.is_object_in_front();
      `

			// Should throw error about exceeding register count
			expect(() => {
				CppParser.cppToByte(code)
			}).toThrow(/exceeds maximum register count/)
		})

		test("should handle loops with front proximity checks", () => {
			const code = `
        while(true) {
          if (front_distance_sensor.is_object_in_front()) {
            all_leds.set_color(RED);
            wait(0.5);
          } else {
            motors.drive(FORWARD, 50);
          }
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Verify we have a front proximity sensor read
			let frontSensorFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
            bytecode[i + 1] === SensorType.FRONT_PROXIMITY) {
					frontSensorFound = true
					break
				}
			}

			expect(frontSensorFound).toBe(true)

			// Verify we have motor forward instruction in the else branch
			let motorGoFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE) {
					motorGoFound = true
					break
				}
			}

			expect(motorGoFound).toBe(true)
		})
	})

	describe("Wait For Button", () => {
		test("should parse left_button.wait_for_press command", () => {
			const code = "left_button.wait_for_press();"
			const bytecode = CppParser.cppToByte(code)

			// Should generate a WAIT_FOR_BUTTON instruction
			expect(bytecode[0]).toBe(BytecodeOpCode.WAIT_FOR_BUTTON)
			expect(bytecode[1]).toBe(0) // Unused
			expect(bytecode[2]).toBe(0) // Unused
			expect(bytecode[3]).toBe(0) // Unused
			expect(bytecode[4]).toBe(0) // Unused

			// Should have END instruction
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should handle left_button.wait_for_press in a complex sequence", () => {
			const code = `
        all_leds.set_color(BLUE);
        left_button.wait_for_press();
        all_leds.set_color(GREEN);
        wait(1);
        left_button.wait_for_press();
        all_leds.set_color(RED);
      `

			const bytecode = CppParser.cppToByte(code)

			// Count number of WAIT_FOR_BUTTON instructions
			let waitForButtonCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WAIT_FOR_BUTTON) {
					waitForButtonCount++
				}
			}

			expect(waitForButtonCount).toBe(2)

			// Verify sequence (blue LED, wait, green LED, wait, red LED)
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS) // Blue
			expect(bytecode[1]).toBe(0)
			expect(bytecode[2]).toBe(0)
			expect(bytecode[3]).toBe(MAX_LED_BRIGHTNESS)

			expect(bytecode[5]).toBe(BytecodeOpCode.WAIT_FOR_BUTTON)

			expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS) // Green
			expect(bytecode[11]).toBe(0)
			expect(bytecode[12]).toBe(MAX_LED_BRIGHTNESS)
			expect(bytecode[13]).toBe(0)

			expect(bytecode[15]).toBe(BytecodeOpCode.WAIT)
			expect(bytecode[16]).toBe(1)

			expect(bytecode[20]).toBe(BytecodeOpCode.WAIT_FOR_BUTTON)

			expect(bytecode[25]).toBe(BytecodeOpCode.SET_ALL_LEDS) // Red
			expect(bytecode[26]).toBe(MAX_LED_BRIGHTNESS)
			expect(bytecode[27]).toBe(0)
			expect(bytecode[28]).toBe(0)
		})

		test("should handle left_button.wait_for_press in control structures", () => {
			const code = `
        if (front_distance_sensor.is_object_in_front()) {
          all_leds.set_color(RED);
          left_button.wait_for_press();
        } else {
          all_leds.set_color(GREEN);
        }
        
        for (int i = 0; i < 3; i++) {
          left_button.wait_for_press();
          all_leds.set_color(BLUE);
          wait(0.5);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Count number of WAIT_FOR_BUTTON instructions
			let waitForButtonCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WAIT_FOR_BUTTON) {
					waitForButtonCount++
				}
			}

			// Should have 2 distinct WAIT_FOR_BUTTON instructions
			// One in the if block and one in the for loop
			expect(waitForButtonCount).toBe(2)
		})
	})

	describe("Ultimate Robot Navigation Example", () => {
		test("should handle a complete navigation example with all features", () => {
			const code = `
        left_button.wait_for_press();  // Wait for start button
        
        for (int i = 0; i < 3; i++) {
          // Flash light to indicate start
          all_leds.set_color(BLUE);
          wait(0.2);
          all_leds.set_color(OFF);
          wait(0.2);
        }
        
        while(true) {
          // Check front obstacle
          if (front_distance_sensor.is_object_in_front()) {
            // Front blocked, check sides
            all_leds.set_color(RED);
            wait(0.3);
            
            if (left_distance_sensor.is_object_near()) {
              // Left blocked too, try right
              if (right_distance_sensor.is_object_near()) {
                // All directions blocked
                all_leds.set_color(PURPLE);
                left_button.wait_for_press();  // Wait for manual intervention
              } else {
                // Turn right
                motors.turn(CLOCKWISE, 90);
              }
            } else {
              // Turn left
              motors.turn(COUNTERCLOCKWISE, 90);
            }
          } else {
            // Path is clear, move forward
            all_leds.set_color(GREEN);
            motors.drive(FORWARD, 50);
            wait(0.2);
          }
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// This complex example should use all the features we're testing
			let foundWaitForButton = false
			let foundFrontProximity = false
			let foundLeftProximity = false
			let foundRightProximity = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WAIT_FOR_BUTTON) {
					foundWaitForButton = true
				} else if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.FRONT_PROXIMITY) {
						foundFrontProximity = true
					} else if (bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) {
						foundLeftProximity = true
					} else if (bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY) {
						foundRightProximity = true
					}
				}
			}

			expect(foundWaitForButton).toBe(true)
			expect(foundFrontProximity).toBe(true)
			expect(foundLeftProximity).toBe(true)
			expect(foundRightProximity).toBe(true)
		})
	})
})
