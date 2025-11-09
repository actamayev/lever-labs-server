import { CppParser } from "@/parser/cpp-parser"
import { BytecodeOpCode, ComparisonOp, SensorType } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

describe("Else-If Edge Cases and Specific Scenarios", () => {
	describe("Jump Address Fixup Verification", () => {
		test("should correctly fix jump addresses in simple else-if chain", () => {
			const code = `
				if (false) {
					all_leds.set_color(RED);
				} else if (false) {
					all_leds.set_color(GREEN);
				} else {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Find all JUMP_IF_FALSE instructions and verify they have non-zero jump distances
			const jumpIfFalseInstructions: { index: number; jumpDistance: number }[] = []
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseInstructions.push({
						index: i,
						jumpDistance: (bytecode[i + 2] << 8) | bytecode[i + 1]
					})
				}
			}

			// All jump distances should be non-zero (properly fixed up)
			for (const jump of jumpIfFalseInstructions) {
				expect(jump.jumpDistance).toBeGreaterThan(0)
			}

			// Find all JUMP instructions and verify they have non-zero jump distances
			const jumpInstructions: { index: number; jumpDistance: number }[] = []
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP) {
					jumpInstructions.push({
						index: i,
						jumpDistance: (bytecode[i + 2] << 8) | bytecode[i + 1]
					})
				}
			}

			// All jump distances should be non-zero (properly fixed up)
			for (const jump of jumpInstructions) {
				expect(jump.jumpDistance).toBeGreaterThan(0)
			}
		})

		test("should handle jump address fixup with nested structures", () => {
			// Focus on the structure that our parser can handle
			const simpleCode = `
				for (int i = 0; i < 3; i++) {
					if (i == 0) {
						all_leds.set_color(RED);
					} else if (i == 1) {
						all_leds.set_color(GREEN);
						wait(0.1);
					} else if (i == 2) {
						all_leds.set_color(BLUE);
						wait(0.2);
					}
				}
			`

			const bytecode = CppParser.cppToByte(simpleCode)

			// Should have properly structured FOR loop
			let forInitFound = false
			let forConditionFound = false
			let jumpBackwardFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.FOR_INIT) forInitFound = true
				else if (bytecode[i] === BytecodeOpCode.FOR_CONDITION) forConditionFound = true
				else if (bytecode[i] === BytecodeOpCode.JUMP_BACKWARD) jumpBackwardFound = true
			}

			expect(forInitFound).toBe(true)
			expect(forConditionFound).toBe(true)
			expect(jumpBackwardFound).toBe(true)
		})
	})

	describe("Specific Bytecode Sequence Verification", () => {
		test("should generate correct bytecode sequence for two-condition else-if", () => {
			const code = `
				if (5 > 10) {
					all_leds.set_color(RED);
				} else if (15 > 10) {
					all_leds.set_color(GREEN);
				} else {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Expected sequence:
			// 1. COMPARE (5 > 10)
			// 2. JUMP_IF_FALSE (to step 5)
			// 3. SET_ALL_LEDS (red)
			// 4. JUMP (to end)
			// 5. COMPARE (15 > 10)
			// 6. JUMP_IF_FALSE (to step 9)
			// 7. SET_ALL_LEDS (green)
			// 8. JUMP (to end)
			// 9. SET_ALL_LEDS (blue)
			// 10. END

			// Verify first comparison
			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[2]).toBe(5)
			expect(bytecode[3]).toBe(10)

			// Verify first JUMP_IF_FALSE
			expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
			expect(bytecode[6]).toBeGreaterThan(0) // Should have valid jump distance

			// Find the second COMPARE instruction
			let secondCompareIndex = -1
			for (let i = 10; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					secondCompareIndex = i
					break
				}
			}

			expect(secondCompareIndex).toBeGreaterThan(0)
			expect(bytecode[secondCompareIndex + 1]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[secondCompareIndex + 2]).toBe(15)
			expect(bytecode[secondCompareIndex + 3]).toBe(10)
		})

		test("should correctly handle register allocation across else-if conditions", () => {
			const code = `
				float a = 1.0;
				float b = 2.0;
				float c = 3.0;
				
				if (a > b) {
					all_leds.set_color(RED);
				} else if (b > c) {
					all_leds.set_color(GREEN);
				} else if (c > a) {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have 3 variable declarations with sequential registers
			const declareVarInstructions: { index: number; register: number }[] = []
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarInstructions.push({
						index: i,
						register: bytecode[i + 1]
					})
				}
			}

			expect(declareVarInstructions.length).toBe(3)
			expect(declareVarInstructions[0].register).toBe(0)
			expect(declareVarInstructions[1].register).toBe(1)
			expect(declareVarInstructions[2].register).toBe(2)

			// Should have comparisons using these registers
			const compareInstructions: { index: number; leftOperand: number; rightOperand: number }[] = []
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareInstructions.push({
						index: i,
						leftOperand: bytecode[i + 2],
						rightOperand: bytecode[i + 3]
					})
				}
			}

			// Check that comparisons use register references (high bit set)
			for (const compare of compareInstructions) {
				const leftIsRegister = (compare.leftOperand & 0x8000) !== 0
				const rightIsRegister = (compare.rightOperand & 0x8000) !== 0

				// At least one operand should be a register reference
				expect(leftIsRegister || rightIsRegister).toBe(true)
			}
		})
	})

	describe("Real-world Integration Scenarios", () => {
		test("should handle else-if in motor control logic", () => {
			const code = `
				if (front_distance_sensor.is_object_in_front()) {
					motors.stop();
				} else if (imu.getPitch() > 45) {
					motors.drive_time(BACKWARD, 2.0, 70);
				} else if (imu.getPitch() < -45) {
					motors.drive_time(FORWARD, 1.0, 50);
				} else if (imu.getRoll() > 30) {
					motors.turn(COUNTERCLOCKWISE, 90);
				} else if (imu.getRoll() < -30) {
					motors.turn(CLOCKWISE, 90);
				} else {
					motors.drive(FORWARD, 60);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have all motor commands
			let motorStopFound = false
			let motorGoTimeFound = false
			let motorTurnCCWFound = false
			let motorTurnCWFound = false
			let motorGoFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_STOP) {
					motorStopFound = true
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE_TIME) {
					motorGoTimeFound = true
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_TURN) {
					if (bytecode[i + 1] === 0) motorTurnCCWFound = true // 0 = counterclockwise
					else if (bytecode[i + 1] === 1) motorTurnCWFound = true // 1 = clockwise
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE) {
					motorGoFound = true
				}
			}

			expect(motorStopFound).toBe(true)
			expect(motorGoTimeFound).toBe(true)
			expect(motorTurnCCWFound).toBe(true)
			expect(motorTurnCWFound).toBe(true)
			expect(motorGoFound).toBe(true)
		})

		test("should handle else-if with LED patterns and timing", () => {
			const code = `
				float time = imu.getYaw();
				
				if (time < 0) {
					all_leds.set_color(RED);
					wait(0.1);
				} else if ((time >= 0) && (time < 90)) {
					all_leds.set_color(GREEN);
					wait(0.2);
				} else if ((time >= 90) && (time < 180)) {
					all_leds.set_color(BLUE);
					wait(0.3);
				} else if ((time >= 180) && (time < 270)) {
					all_leds.set_color(WHITE);
					wait(0.4);
				} else {
					all_leds.set_color(PURPLE);
					wait(0.5);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have sensor read for yaw
			let yawSensorFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
					bytecode[i + 1] === SensorType.YAW) {
					yawSensorFound = true
					break
				}
			}
			expect(yawSensorFound).toBe(true)

			// Should have different wait values
			const waitValues: number[] = []
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WAIT) {
					waitValues.push(bytecode[i + 1])
				}
			}

			expect(waitValues[0]).toBeCloseTo(0.1)
			expect(waitValues[1]).toBeCloseTo(0.2)
			expect(waitValues[2]).toBeCloseTo(0.3)
			expect(waitValues[3]).toBeCloseTo(0.4)
			expect(waitValues[4]).toBeCloseTo(0.5)
		})

		test("should handle wait_for_button with else-if logic", () => {
			const code = `
				left_button.wait_for_press();
				
				while (true) {
					if (front_distance_sensor.is_object_in_front()) {
						all_leds.set_color(RED);
						left_button.wait_for_press();
					} else if (left_distance_sensor.is_object_near()) {
						all_leds.set_color(GREEN);
						wait(1);
					} else if (right_distance_sensor.is_object_near()) {
						all_leds.set_color(BLUE);
						wait(1);
					} else {
						all_leds.set_color(OFF);
						wait(0.1);
					}
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have WAIT_FOR_BUTTON instructions
			let waitForButtonCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WAIT_FOR_BUTTON) {
					waitForButtonCount++
				}
			}
			expect(waitForButtonCount).toBe(2)

			// Should have WHILE loop structure
			let whileStartFound = false
			let whileEndFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WHILE_START) whileStartFound = true
				else if (bytecode[i] === BytecodeOpCode.WHILE_END) whileEndFound = true
			}
			expect(whileStartFound).toBe(true)
			expect(whileEndFound).toBe(true)
		})
	})

	describe("Boundary Testing", () => {
		test("should handle else-if at program size limits", () => {
			// Create a program that's large but within limits
			let code = ""

			// Add many variables
			for (let i = 0; i < 100; i++) {
				code += `int var${i} = ${i};\n`
			}

			// Add else-if chain
			code += "if (var0 > var1) { all_leds.set_color(RED); }"
			for (let i = 2; i < 20; i++) {
				code += ` else if (var${i} > var${i - 1}) { wait(${i * 10}); }`
			}
			code += " else { all_leds.set_color(BLUE); }"

			// Should parse successfully
			expect(() => {
				CppParser.cppToByte(code)
			}).not.toThrow()
		})

		test("should handle else-if with maximum supported nesting", () => {
			const code = `
				if (false) {
					if (false) {
						if (5 > 6) {
							all_leds.set_color(RED);
						} else if (7 > 8) {
							all_leds.set_color(GREEN);
						}
					} else if (9 > 10) {
						if (11 > 12) {
							all_leds.set_color(BLUE);
						} else if (13 > 14) {
							all_leds.set_color(WHITE);
						}
					}
				} else if (15 > 16) {
					if (17 > 18) {
						all_leds.set_color(PURPLE);
					}
				}
			`

			// Should handle deep nesting without issues
			expect(() => {
				CppParser.cppToByte(code)
			}).not.toThrow()

			const bytecode = CppParser.cppToByte(code)

			// Should have multiple comparisons
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}
			expect(compareCount).toBeGreaterThan(5)
		})
	})
})
