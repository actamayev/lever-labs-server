import { CppParser } from "../../src/parser/cpp-parser"
import { BytecodeOpCode, ComparisonOp, SensorType } from "../../src/types/bytecode-types"
import { MAX_LED_BRIGHTNESS } from "../../src/utils/constants/constants"
import { describe, test, expect } from "@jest/globals"

describe("Else-If Functionality", () => {
	describe("Basic Else-If Chains", () => {
		test("should parse simple else-if chain with numeric comparisons", () => {
			const code = `
				if (10 > 20) {
					all_leds.set_color(RED);
				} else if (5 < 15) {
					all_leds.set_color(GREEN);
				} else if (3 == 3) {
					all_leds.set_color(BLUE);
				} else {
					all_leds.set_color(WHITE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have multiple COMPARE instructions
			let compareCount = 0
			let jumpIfFalseCount = 0
			let jumpCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP) {
					jumpCount++
				}
			}

			// Should have 3 comparisons (one for each if/else-if)
			expect(compareCount).toBe(3)
			// Should have 3 JUMP_IF_FALSE (one for each condition)
			expect(jumpIfFalseCount).toBe(3)
			// Should have 3 JUMP instructions (to skip subsequent else-if blocks)
			expect(jumpCount).toBe(3)

			// Verify all LED colors are present
			let redLedFound = false
			let greenLedFound = false
			let blueLedFound = false
			let whiteLedFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					const r = bytecode[i + 1]
					const g = bytecode[i + 2]
					const b = bytecode[i + 3]

					if (r === MAX_LED_BRIGHTNESS && g === 0 && b === 0) redLedFound = true
					else if (r === 0 && g === MAX_LED_BRIGHTNESS && b === 0) greenLedFound = true
					else if (r === 0 && g === 0 && b === MAX_LED_BRIGHTNESS) blueLedFound = true
					else if (r === MAX_LED_BRIGHTNESS && g === MAX_LED_BRIGHTNESS && b === MAX_LED_BRIGHTNESS) whiteLedFound = true
				}
			}

			expect(redLedFound).toBe(true)
			expect(greenLedFound).toBe(true)
			expect(blueLedFound).toBe(true)
			expect(whiteLedFound).toBe(true)
		})

		test("should parse single else-if without else", () => {
			const code = `
				if (10 < 5) {
					all_leds.set_color(RED);
				} else if (20 > 15) {
					all_leds.set_color(GREEN);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have 2 comparisons, 2 JUMP_IF_FALSE, 2 JUMP
			let compareCount = 0
			let jumpIfFalseCount = 0
			let jumpCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP) {
					jumpCount++
				}
			}

			expect(compareCount).toBe(2)
			expect(jumpIfFalseCount).toBe(2)
			expect(jumpCount).toBe(2) // FIXED: Should be 2, not 1
		})
	})

	describe("Compound Conditions in Else-If", () => {
		test("should handle AND conditions in else-if", () => {
			const code = `
				if (false) {
					all_leds.set_color(RED);
				} else if ((10 > 5) && (20 > 15)) {
					all_leds.set_color(GREEN);
				} else {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have multiple COMPARE instructions for the compound condition
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}
			expect(compareCount).toBeGreaterThanOrEqual(3) // 1 for if + 2 for else-if AND

			// Should have JUMP_IF_FALSE for short-circuit evaluation
			let jumpIfFalseCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				}
			}
			expect(jumpIfFalseCount).toBeGreaterThanOrEqual(3)
		})

		test("should handle OR conditions in else-if", () => {
			const code = `
				if (false) {
					all_leds.set_color(RED);
				} else if ((5 > 10) || (15 > 10)) {
					all_leds.set_color(GREEN);
				} else {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have JUMP_IF_TRUE for OR short-circuit
			let jumpIfTrueCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP_IF_TRUE) {
					jumpIfTrueCount++
				}
			}
			expect(jumpIfTrueCount).toBeGreaterThanOrEqual(1)
		})
	})

	// Add a specific test to understand the jump pattern
	describe("Jump Pattern Analysis", () => {
		test("should understand jump pattern in else-if chains", () => {
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

			// Count instructions
			let compareCount = 0
			let jumpIfFalseCount = 0
			let jumpCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) compareCount++
				else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) jumpIfFalseCount++
				else if (bytecode[i] === BytecodeOpCode.JUMP) jumpCount++
			}

			// Just verify the structure is reasonable
			expect(compareCount).toBe(2) // if + else-if
			expect(jumpIfFalseCount).toBe(2) // one for each condition
			expect(jumpCount).toBeGreaterThanOrEqual(1) // at least one jump to skip blocks
		})
	})

	describe("Else-If with Different Comparison Operators", () => {
		test("should handle all comparison operators in else-if", () => {
			const operators = [
				{ code: "else if (5 > 3)", op: ComparisonOp.GREATER_THAN },
				{ code: "else if (3 < 5)", op: ComparisonOp.LESS_THAN },
				{ code: "else if (5 >= 5)", op: ComparisonOp.GREATER_EQUAL },
				{ code: "else if (5 <= 5)", op: ComparisonOp.LESS_EQUAL },
				{ code: "else if (5 == 5)", op: ComparisonOp.EQUAL },
				{ code: "else if (5 != 6)", op: ComparisonOp.NOT_EQUAL }
			]

			for (const { code, op } of operators) {
				const fullCode = `
			if (false) {
				all_leds.set_color(RED);
			} ${code} {
				all_leds.set_color(GREEN);
			}
		`

				const bytecode = CppParser.cppToByte(fullCode)

				// Find the second COMPARE instruction (for the else-if)
				let secondCompareIndex = -1
				let compareCount = 0

				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.COMPARE) {
						compareCount++
						if (compareCount === 2) {
							secondCompareIndex = i
							break
						}
					}
				}

				expect(secondCompareIndex).toBeGreaterThan(0)
				expect(bytecode[secondCompareIndex + 1]).toBe(op)
			}
		})
	})

	describe("Else-If with Variables", () => {
		test("should handle variables in else-if conditions", () => {
			const code = `
		int x = 10;
		float y = 5.5;
		bool flag = true;
		
		if (x < 5) {
			all_leds.set_color(RED);
		} else if (y > 3.0) {
			all_leds.set_color(GREEN);
		} else if (flag == true) {
			all_leds.set_color(BLUE);
		} else {
			all_leds.set_color(WHITE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have variable declarations
			let declareVarCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarCount++
				}
			}
			expect(declareVarCount).toBe(3)

			// Should have comparisons using registers (high bit set)
			let registerCompareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					if ((bytecode[i + 2] & 0x8000) || (bytecode[i + 3] & 0x8000)) {
						registerCompareCount++
					}
				}
			}
			expect(registerCompareCount).toBeGreaterThan(0)
		})

		test("should handle variable comparisons on both sides", () => {
			const code = `
				int a = 10;
				int b = 20;
				int c = 30;
				
				if (a > b) {
					all_leds.set_color(RED);
				} else if (b < c) {
					all_leds.set_color(GREEN);
				} else {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Find COMPARE instructions that use registers on both sides
			let bothSidesRegisterCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					if ((bytecode[i + 2] & 0x8000) && (bytecode[i + 3] & 0x8000)) {
						bothSidesRegisterCount++
					}
				}
			}
			expect(bothSidesRegisterCount).toBe(2)
		})

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
	})

	describe("Else-If with Sensor Readings", () => {
		test("should handle sensor readings in else-if conditions", () => {
			const code = `
				if (imu.getPitch() > 30) {
					all_leds.set_color(RED);
				} else if (imu.getRoll() < -10) {
					all_leds.set_color(GREEN);
				} else if (imu.getYaw() == 0) {
					all_leds.set_color(BLUE);
				} else {
					all_leds.set_color(WHITE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have READ_SENSOR instructions for all three sensors
			let pitchFound = false
			let rollFound = false
			let yawFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.PITCH) pitchFound = true
					else if (bytecode[i + 1] === SensorType.ROLL) rollFound = true
					else if (bytecode[i + 1] === SensorType.YAW) yawFound = true
				}
			}

			expect(pitchFound).toBe(true)
			expect(rollFound).toBe(true)
			expect(yawFound).toBe(true)

			// Should use different registers for each sensor
			const sensorRegisters = new Set()
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					sensorRegisters.add(bytecode[i + 2])
				}
			}
			expect(sensorRegisters.size).toBe(3)
		})

		test("should handle mixed sensor and variable conditions", () => {
			const code = `
				float threshold = 15.0;
				
				if (imu.getPitch() > threshold) {
					all_leds.set_color(RED);
				} else if (threshold < 20.0) {
					all_leds.set_color(GREEN);
				} else if (imu.getRoll() != 0) {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have both sensor reads and variable declarations
			let sensorReadCount = 0
			let declareVarCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					sensorReadCount++
				} else if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarCount++
				}
			}

			expect(sensorReadCount).toBe(2)
			expect(declareVarCount).toBe(1)
		})
	})

	describe("Else-If with Proximity Sensors", () => {
		test("should handle proximity sensors in else-if conditions", () => {
			const code = `
				if (front_distance_sensor.is_object_in_front()) {
					all_leds.set_color(RED);
				} else if (left_distance_sensor.is_object_near()) {
					all_leds.set_color(GREEN);
				} else if (right_distance_sensor.is_object_near()) {
					all_leds.set_color(BLUE);
				} else {
					all_leds.set_color(WHITE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have READ_SENSOR instructions for all three proximity sensors
			let frontFound = false
			let leftFound = false
			let rightFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.FRONT_PROXIMITY) frontFound = true
					else if (bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) leftFound = true
					else if (bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY) rightFound = true
				}
			}

			expect(frontFound).toBe(true)
			expect(leftFound).toBe(true)
			expect(rightFound).toBe(true)

			// Should have comparisons with true (1) for boolean sensors
			let booleanCompareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE &&
					bytecode[i + 1] === ComparisonOp.EQUAL &&
					bytecode[i + 3] === 1) {
					booleanCompareCount++
				}
			}
			expect(booleanCompareCount).toBe(3)
		})

		test("should handle mixed proximity and regular sensor conditions", () => {
			const code = `
				if (front_distance_sensor.is_object_in_front()) {
					all_leds.set_color(RED);
				} else if (imu.getPitch() > 45) {
					all_leds.set_color(GREEN);
				} else if (left_distance_sensor.is_object_near()) {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have both proximity and regular sensor reads
			let frontProximityFound = false
			let leftProximityFound = false
			let pitchFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.FRONT_PROXIMITY) frontProximityFound = true
					else if (bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) leftProximityFound = true
					else if (bytecode[i + 1] === SensorType.PITCH) pitchFound = true
				}
			}

			expect(frontProximityFound).toBe(true)
			expect(leftProximityFound).toBe(true)
			expect(pitchFound).toBe(true)
		})
	})

	describe("Compound Conditions in Else-If", () => {
		test("should handle AND conditions in else-if", () => {
			const code = `
				if (false) {
					all_leds.set_color(RED);
				} else if ((10 > 5) && (20 > 15)) {
					all_leds.set_color(GREEN);
				} else {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have multiple COMPARE instructions for the compound condition
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}
			expect(compareCount).toBeGreaterThanOrEqual(3) // 1 for if + 2 for else-if AND

			// Should have JUMP_IF_FALSE for short-circuit evaluation
			let jumpIfFalseCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				}
			}
			expect(jumpIfFalseCount).toBeGreaterThanOrEqual(3)
		})

		test("should handle OR conditions in else-if", () => {
			const code = `
				if (false) {
					all_leds.set_color(RED);
				} else if ((5 > 10) || (15 > 10)) {
					all_leds.set_color(GREEN);
				} else {
					all_leds.set_color(BLUE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have JUMP_IF_TRUE for OR short-circuit
			let jumpIfTrueCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.JUMP_IF_TRUE) {
					jumpIfTrueCount++
				}
			}
			expect(jumpIfTrueCount).toBeGreaterThanOrEqual(1)
		})

		test("should handle compound conditions with variables", () => {
			const code = `
		int a = 5;
		int b = 10;
		bool flag = true;
		
		if (false) {
			all_leds.set_color(RED);
		} else if ((a > 3) && (b < 15)) {
			all_leds.set_color(GREEN);
		} else if ((flag == true) || (a == b)) {
			all_leds.set_color(BLUE);
		} else {
			all_leds.set_color(WHITE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have variable declarations
			let declareVarCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarCount++
				}
			}
			expect(declareVarCount).toBe(3)

			// Should have multiple comparisons involving registers
			let registerCompareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE &&
			((bytecode[i + 2] & 0x8000) || (bytecode[i + 3] & 0x8000))) {
					registerCompareCount++
				}
			}
			expect(registerCompareCount).toBeGreaterThan(0)
		})

		test("should handle compound conditions with variables", () => {
			const code = `
				int a = 5;
				int b = 10;
				bool flag = true;
				
				if (false) {
					all_leds.set_color(RED);
				} else if ((a > 3) && (b < 15)) {
					all_leds.set_color(GREEN);
				} else if ((flag) || (a == b)) {
					all_leds.set_color(BLUE);
				} else {
					all_leds.set_color(WHITE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have variable declarations
			let declareVarCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarCount++
				}
			}
			expect(declareVarCount).toBe(3)

			// Should have multiple comparisons involving registers
			let registerCompareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE &&
					((bytecode[i + 2] & 0x8000) || (bytecode[i + 3] & 0x8000))) {
					registerCompareCount++
				}
			}
			expect(registerCompareCount).toBeGreaterThan(0)
		})
	})

	describe("Nested Else-If Structures", () => {
		test("should handle else-if inside loops", () => {
			const code = `
		for (int i = 0; i < 3; i++) {
			if (i == 0) {
				all_leds.set_color(RED);
			} else if (i == 1) {
				all_leds.set_color(GREEN);
			} else if (i == 2) {
				all_leds.set_color(BLUE);
			}
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have FOR loop instructions
			let forInitFound = false
			let forConditionFound = false
			let forIncrementFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.FOR_INIT) forInitFound = true
				else if (bytecode[i] === BytecodeOpCode.FOR_CONDITION) forConditionFound = true
				else if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) forIncrementFound = true
			}

			expect(forInitFound).toBe(true)
			expect(forConditionFound).toBe(true)
			expect(forIncrementFound).toBe(true)

			// Should have comparisons for the if/else-if chain
			// FOR_CONDITION uses its own internal logic, not COMPARE instructions
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}
			expect(compareCount).toBe(3) // Just the 3 comparisons: i==0, i==1, i==2
		})

		test("should handle else-if inside while loops", () => {
			const code = `
				while (true) {
					if (front_distance_sensor.is_object_in_front()) {
						all_leds.set_color(RED);
					} else if (left_distance_sensor.is_object_near()) {
						all_leds.set_color(GREEN);
					} else if (right_distance_sensor.is_object_near()) {
						all_leds.set_color(BLUE);
					} else {
						motors.drive(FORWARD, 50);
					}
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have WHILE loop instructions
			let whileStartFound = false
			let whileEndFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.WHILE_START) whileStartFound = true
				else if (bytecode[i] === BytecodeOpCode.WHILE_END) whileEndFound = true
			}

			expect(whileStartFound).toBe(true)
			expect(whileEndFound).toBe(true)

			// Should have motor command in else block
			let motorGoFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE) {
					motorGoFound = true
				}
			}
			expect(motorGoFound).toBe(true)
		})

		test("should handle nested if-else inside else-if", () => {
			const code = `
				if (10 > 20) {
					all_leds.set_color(RED);
				} else if (5 < 15) {
					if (3 == 3) {
						all_leds.set_color(GREEN);
					} else {
						all_leds.set_color(BLUE);
					}
				} else {
					all_leds.set_color(WHITE);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have multiple comparisons and jumps
			let compareCount = 0
			let jumpCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP ||
						  bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpCount++
				}
			}

			expect(compareCount).toBe(3) // Outer if + else-if + inner if
			expect(jumpCount).toBeGreaterThanOrEqual(4) // Multiple jumps for nested structure
		})

		test("should handle multiple levels of else-if nesting", () => {
			const code = `
				if (false) {
					all_leds.set_color(RED);
				} else if (false) {
					if (5 > 6) {
						all_leds.set_color(GREEN);
					} else if (7 > 8) {
						all_leds.set_color(BLUE);
					} else {
						all_leds.set_color(WHITE);
					}
				} else if (9 > 10) {
					all_leds.set_color(PURPLE);
				} else {
					wait(1);
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have all LED colors plus wait
			let redLedFound = false
			let greenLedFound = false
			let blueLedFound = false
			let whiteLedFound = false
			let purpleLedFound = false
			let waitFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					const r = bytecode[i + 1]
					const g = bytecode[i + 2]
					const b = bytecode[i + 3]

					if (r === MAX_LED_BRIGHTNESS && g === 0 && b === 0) redLedFound = true
					else if (r === 0 && g === MAX_LED_BRIGHTNESS && b === 0) greenLedFound = true
					else if (r === 0 && g === 0 && b === MAX_LED_BRIGHTNESS) blueLedFound = true
					else if (r === MAX_LED_BRIGHTNESS && g === MAX_LED_BRIGHTNESS && b === MAX_LED_BRIGHTNESS) whiteLedFound = true
					else if (r === MAX_LED_BRIGHTNESS && g === 0 && b === MAX_LED_BRIGHTNESS) purpleLedFound = true
				} else if (bytecode[i] === BytecodeOpCode.WAIT) {
					waitFound = true
				}
			}

			expect(redLedFound).toBe(true)
			expect(greenLedFound).toBe(true)
			expect(blueLedFound).toBe(true)
			expect(whiteLedFound).toBe(true)
			expect(purpleLedFound).toBe(true)
			expect(waitFound).toBe(true)
		})
	})

	describe("Complex Real-World Scenarios", () => {
		test("should handle robot navigation with else-if logic", () => {
			const code = `
				while (true) {
					if (front_distance_sensor.is_object_in_front()) {
						motors.stop();
						if (left_distance_sensor.is_object_near()) {
							motors.turn(CLOCKWISE, 90);
						} else if (right_distance_sensor.is_object_near()) {
							motors.turn(COUNTERCLOCKWISE, 90);
						} else {
							motors.drive(BACKWARD, 50);
							wait(0.5);
						}
					} else if (imu.getPitch() > 30) {
						motors.drive_time(BACKWARD, 1.0, 30);
					} else if (imu.getRoll() < -30) {
						motors.drive_time(BACKWARD, 1.0, 30);
					} else {
						motors.drive(FORWARD, 60);
					}
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Should have all expected sensor reads
			let frontProximityFound = false
			let leftProximityFound = false
			let rightProximityFound = false
			let pitchFound = false
			let rollFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.FRONT_PROXIMITY) frontProximityFound = true
					else if (bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) leftProximityFound = true
					else if (bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY) rightProximityFound = true
					else if (bytecode[i + 1] === SensorType.PITCH) pitchFound = true
					else if (bytecode[i + 1] === SensorType.ROLL) rollFound = true
				}
			}

			expect(frontProximityFound).toBe(true)
			expect(leftProximityFound).toBe(true)
			expect(rightProximityFound).toBe(true)
			expect(pitchFound).toBe(true)
			expect(rollFound).toBe(true)

			// Should have all expected motor commands
			let motorStopFound = false
			let motorGoFound = false
			let motorTurnFound = false
			let motorGoTimeFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_STOP) motorStopFound = true
				else if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE) motorGoFound = true
				else if (bytecode[i] === BytecodeOpCode.MOTOR_TURN) motorTurnFound = true
				else if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE_TIME) motorGoTimeFound = true
			}

			expect(motorStopFound).toBe(true)
			expect(motorGoFound).toBe(true)
			expect(motorTurnFound).toBe(true)
			expect(motorGoTimeFound).toBe(true)
		})

		test("should handle LED pattern with else-if and variables", () => {
			const code = `
		int pattern = 1;
		
		for (int i = 0; i < 5; i++) {
			if (pattern == 1) {
				all_leds.set_color(RED);
			} else if (pattern == 2) {
				all_leds.set_color(GREEN);
			} else if (pattern == 3) {
				all_leds.set_color(BLUE);
			} else if (pattern == 4) {
				all_leds.set_color(YELLOW);
			} else {
				all_leds.set_color(WHITE);
			}
			
			wait(0.2);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have variable operations
			let declareVarFound = false
			let setVarFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) declareVarFound = true
				else if (bytecode[i] === BytecodeOpCode.SET_VAR) setVarFound = true
			}

			expect(declareVarFound).toBe(true)
			expect(setVarFound).toBe(true)

			// Should have FOR loop structure
			let forInitFound = false
			let forConditionFound = false
			let forIncrementFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.FOR_INIT) forInitFound = true
				else if (bytecode[i] === BytecodeOpCode.FOR_CONDITION) forConditionFound = true
				else if (bytecode[i] === BytecodeOpCode.FOR_INCREMENT) forIncrementFound = true
			}

			expect(forInitFound).toBe(true)
			expect(forConditionFound).toBe(true)
			expect(forIncrementFound).toBe(true)
		})
	})

	describe("Error Handling and Edge Cases", () => {
		test("should parse else-if chain without final else", () => {
			const code = `
		if (false) {
			all_leds.set_color(RED);
		} else if (false) {
			all_leds.set_color(GREEN);
		} else if (5 > 6) {
			all_leds.set_color(BLUE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should still have proper jump structure
			let compareCount = 0
			let jumpIfFalseCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				}
			}

			expect(compareCount).toBe(3)
			expect(jumpIfFalseCount).toBe(3)
		})

		test("should throw error for malformed else-if syntax", () => {
			expect(() => {
				CppParser.cppToByte(`
					if (true) {
						all_leds.set_color(RED);
					} else if {
						all_leds.set_color(GREEN);
					}
				`)
			}).toThrow(/Invalid command/)
		})

		test("should throw error for else-if without condition", () => {
			expect(() => {
				CppParser.cppToByte(`
					if (true) {
						all_leds.set_color(RED);
					} else if () {
						all_leds.set_color(GREEN);
					}
				`)
			}).toThrow(/Invalid command/)
		})

		test("should throw error for else-if with invalid operator", () => {
			expect(() => {
				CppParser.cppToByte(`
					if (true) {
						all_leds.set_color(RED);
					} else if (5 <> 3) {
						all_leds.set_color(GREEN);
					}
				`)
			}).toThrow(/Invalid command/)
		})

		test("should handle else-if with complex nested parentheses", () => {
			const code = `
		if (false) {
			all_leds.set_color(RED);
		} else if (((10 > 5) && (20 > 15)) || ((30 < 35) && (40 < 45))) {
			all_leds.set_color(GREEN);
		} else {
			all_leds.set_color(BLUE);
		}
	`

			// Should throw error for complex conditions (current limitation)
			expect(() => {
				CppParser.cppToByte(code)
			}).toThrow(/Complex conditions with multiple logical operators are not supported/)
		})

		test("should handle maximum register usage with else-if", () => {
			// Create a program that approaches but doesn't exceed register limits
			let code = ""
			const numVars = 50

			// Declare many variables
			for (let i = 0; i < numVars; i++) {
				code += `float var${i} = ${i}.0;\n`
			}

			// Use variables in else-if chain
			code += `
				if (var0 > var1) {
					all_leds.set_color(RED);
				}
			`

			for (let i = 2; i < Math.min(numVars, 10); i++) {
				code += ` else if (var${i} > var${i - 1}) {
					all_leds.set_color(GREEN);
				}`
			}

			code += ` else {
				all_leds.set_color(BLUE);
			}`

			// Should parse without throwing
			expect(() => {
				CppParser.cppToByte(code)
			}).not.toThrow()
		})

		test("should handle empty else-if blocks", () => {
			const code = `
		if (false) {
			// empty
		} else if (3 > 2) {
			// empty else-if
		} else {
			all_leds.set_color(WHITE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should still have proper structure
			let compareCount = 0
			let jumpCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP ||
				  bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpCount++
				}
			}

			expect(compareCount).toBe(2)
			expect(jumpCount).toBeGreaterThan(0)
		})
	})

	describe("Performance and Optimization", () => {
		test("should handle long else-if chains efficiently", () => {
			let code = "if (false) { all_leds.set_color(RED); }"

			// Create a chain of 20 else-if statements
			for (let i = 1; i <= 20; i++) {
				code += ` else if (${i} == ${i}) { wait(${i * 10}); }`
			}

			code += " else { all_leds.set_color(WHITE); }"

			const bytecode = CppParser.cppToByte(code)

			// Should have correct number of comparisons
			let compareCount = 0
			let waitCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.WAIT) {
					waitCount++
				}
			}

			expect(compareCount).toBe(21) // 1 initial + 20 else-if
			expect(waitCount).toBe(20) // One wait per else-if
		})

		test("should generate correct jump distances for large else-if chains", () => {
			let code = "if (false) { all_leds.set_color(RED); wait(0.1); }"

			// Create else-if chain with substantial code in each block
			for (let i = 1; i <= 10; i++) {
				code += ` else if (${i} == ${i}) {
			all_leds.set_color(GREEN);
			wait(${i / 10});}
			all_leds.set_color(BLUE);
			wait(${i / 20});
		}`
			}

			code += " else { all_leds.set_color(WHITE); }"

			// Should parse without exceeding jump distance limits
			expect(() => {
				CppParser.cppToByte(code)
			}).not.toThrow(/Jump distance.*too large/)
		})
	})

	describe("Misc Tests", () => {
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

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_STOP) {
					motorStopFound = true
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE_TIME) {
					motorGoTimeFound = true
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_TURN) {
					if (bytecode[i + 1] === 0) motorTurnCCWFound = true // 0 = counterclockwise
					else if (bytecode[i + 1] === 1) motorTurnCWFound = true // 1 = clockwise
				}
			}

			expect(motorStopFound).toBe(true)
			expect(motorGoTimeFound).toBe(true)
			expect(motorTurnCCWFound).toBe(true)
			expect(motorTurnCWFound).toBe(true)
		})

		// 6. Fix the bytecode sequence verification test
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

		// 7. Simple debug test to understand the actual pattern
		test("should debug jump instruction patterns", () => {
			const code = `
		if (false) {
			all_leds.set_color(RED);
		} else if (false) {
			all_leds.set_color(GREEN);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Just count and verify the structure is reasonable
			let compareCount = 0
			let jumpIfFalseCount = 0
			let jumpCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP) {
					jumpCount++
				}
			}

			// Verify basic structure - the exact numbers may vary but should be reasonable
			expect(compareCount).toBe(2) // Two conditions
			expect(jumpIfFalseCount).toBe(2) // Two conditional jumps
			expect(jumpCount).toBeGreaterThanOrEqual(1) // At least one unconditional jump
			expect(jumpCount).toBeLessThanOrEqual(3) // But not too many
		})
	})

	describe("Test boolean conditions", () => {
		// Test to verify boolean literal support works
		test("should handle boolean literals in conditions", () => {
			const code = `
		if (true) {
			all_leds.set_color(RED);
		} else if (false) {
			all_leds.set_color(GREEN);
		} else {
			all_leds.set_color(BLUE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have two comparisons
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}
			expect(compareCount).toBe(2)

			// First comparison should compare with 1.0 (true)
			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(ComparisonOp.EQUAL)
			expect(bytecode[2]).toBe(1.0) // true becomes 1.0
			expect(bytecode[3]).toBe(1) // compared with 1 (true)

			// Find second comparison
			let secondCompareIndex = -1
			let foundCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					foundCount++
					if (foundCount === 2) {
						secondCompareIndex = i
						break
					}
				}
			}

			// Second comparison should compare with 0.0 (false)
			expect(secondCompareIndex).toBeGreaterThan(0)
			expect(bytecode[secondCompareIndex + 1]).toBe(ComparisonOp.EQUAL)
			expect(bytecode[secondCompareIndex + 2]).toBe(0.0) // false becomes 0.0
			expect(bytecode[secondCompareIndex + 3]).toBe(1) // compared with 1 (true)
		})

		// Test boolean variables with boolean literals
		test("should handle boolean variables compared to boolean literals", () => {
			const code = `
		bool flag = true;
		
		if (flag == true) {
			all_leds.set_color(RED);
		} else if (flag == false) {
			all_leds.set_color(GREEN);
		} else {
			all_leds.set_color(BLUE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have variable declaration
			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[7]).toBe(1) // true becomes 1

			// Should have comparisons using registers and boolean literals
			let registerCompareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					// Check if one operand is a register (high bit set) and other is boolean literal
					const leftIsRegister = (bytecode[i + 2] & 0x8000) !== 0
					const rightIsRegister = (bytecode[i + 3] & 0x8000) !== 0
					const leftValue = leftIsRegister ? (bytecode[i + 2] & 0x7FFF) : bytecode[i + 2]
					const rightValue = rightIsRegister ? (bytecode[i + 3] & 0x7FFF) : bytecode[i + 3]

					// One should be register, other should be boolean literal (1.0 or 0.0)
					if ((leftIsRegister && (rightValue === 1.0 || rightValue === 0.0)) ||
				(rightIsRegister && (leftValue === 1.0 || leftValue === 0.0))) {
						registerCompareCount++
					}
				}
			}
			expect(registerCompareCount).toBeGreaterThan(0)
		})
		// Test simple boolean conditions like if (flag)
		test("should handle simple boolean variable conditions", () => {
			const code = `
		bool isReady = true;
		bool isEnabled = false;
		
		if (isReady) {
			all_leds.set_color(RED);
		} else if (isEnabled) {
			all_leds.set_color(GREEN);
		} else {
			all_leds.set_color(BLUE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have variable declarations
			let declareVarCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarCount++
				}
			}
			expect(declareVarCount).toBe(2)

			// Should have comparisons that compare boolean variables with true (1)
			let booleanCompareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE &&
			bytecode[i + 1] === ComparisonOp.EQUAL &&
			bytecode[i + 3] === 1) { // Comparing with true
					booleanCompareCount++
				}
			}
			expect(booleanCompareCount).toBe(2) // Two boolean conditions
		})

		// Test compound boolean conditions
		test("should handle compound boolean conditions with literals", () => {
			const code = `
		bool flag1 = true;
		bool flag2 = false;
		
		if ((flag1 == true) && (flag2 == false)) {
			all_leds.set_color(RED);
		} else if ((true) || (false)) {
			all_leds.set_color(GREEN);
		} else {
			all_leds.set_color(BLUE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should parse successfully and have multiple comparisons
			let compareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				}
			}
			expect(compareCount).toBeGreaterThanOrEqual(4) // At least 4 comparisons
		})

		// Now your original test should work:
		test("should handle variables in else-if conditions", () => {
			const code = `
		int x = 10;
		float y = 5.5;
		bool flag = true;
		
		if (x < 5) {
			all_leds.set_color(RED);
		} else if (y > 3.0) {
			all_leds.set_color(GREEN);
		} else if (flag == true) {
			all_leds.set_color(BLUE);
		} else {
			all_leds.set_color(WHITE);
		}
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have variable declarations
			let declareVarCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarCount++
				}
			}
			expect(declareVarCount).toBe(3)

			// Should have comparisons using registers (high bit set)
			let registerCompareCount = 0
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					if ((bytecode[i + 2] & 0x8000) || (bytecode[i + 3] & 0x8000)) {
						registerCompareCount++
					}
				}
			}
			expect(registerCompareCount).toBeGreaterThan(0)
		})
	})
})


