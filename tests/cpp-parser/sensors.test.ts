import { CppParser } from "parser/cpp-parser"
import { MAX_LED_BRIGHTNESS } from "@/utils/constants/constants"
import { BytecodeOpCode, ComparisonOp, SensorType } from "@/types/bytecode-types"
import { BytecodeInstruction } from "@/types/bytecode"
import { describe, test, expect } from "@jest/globals"

describe("Sensor Functionality", () => {
	function testSensorReading(sensorMethod: string, expectedSensorType: SensorType): void {
		const code = `if (imu.${sensorMethod}() > 10) {
		all_leds.set_color(RED);
	}`

		const bytecode = CppParser.cppToByte(code)

		// 1. IMU_READ
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
			const code = `if (imu.getPitch() == 0) {
			all_leds.set_color(RED);
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.PITCH)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor inequality comparison", () => {
			const code = `if (imu.getYaw() != 45) {
			all_leds.set_color(GREEN);
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.YAW)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.NOT_EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor less than comparison", () => {
			const code = `if (imu.getXAccel() < -5) {
			all_leds.set_color(BLUE);
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.ACCEL_X)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.LESS_THAN)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor greater than or equal comparison", () => {
			const code = `if (imu.getAccelMagnitude() >= 9.8) {
			all_leds.set_color(PURPLE);
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.ACCEL_MAG)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.GREATER_EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})

		test("should parse sensor less than or equal comparison", () => {
			const code = `if (imu.getZRotationRate() <= 180) {
			all_leds.set_color(WHITE);
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.ROT_RATE_Z)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.LESS_EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
		})
	})

	test("should throw error for unknown sensor method", () => {
		const originalParseCppCode = CppParser["parseCppCode"]
		CppParser["parseCppCode"] = function(): BytecodeInstruction[] {
			return originalParseCppCode.call(this, "if (imu.getNonExistent() > 10)")
		}

		try {
			expect(() => {
				CppParser.cppToByte("// This content doesn't matter due to the mock")
			}).toThrow(/Unknown sensor method/)
		} finally {
			CppParser["parseCppCode"] = originalParseCppCode
		}
	})

	describe("Proximity Detection in Conditionals", () => {
		test("should parse if statement with left proximity detection", () => {
			const code = `if (left_distance_sensor.is_object_near()) {
				all_leds.set_color(RED);
			} else {
				all_leds.set_color(GREEN);
			}`

			const bytecode = CppParser.cppToByte(code)

			// Find READ_SENSOR instruction for left proximity
			let sensorReadFound = false
			let compareFound = false
			let jumpIfFalseFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
					bytecode[i + 1] === SensorType.SIDE_LEFT_PROXIMITY) {
					sensorReadFound = true
				} else if (bytecode[i] === BytecodeOpCode.COMPARE &&
						  bytecode[i + 1] === ComparisonOp.EQUAL &&
						  bytecode[i + 3] === 1) { // Comparing with true (1)
					compareFound = true
				} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseFound = true
				}
			}

			expect(sensorReadFound).toBe(true)
			expect(compareFound).toBe(true)
			expect(jumpIfFalseFound).toBe(true)

			// Check for LED colors in both branches
			let redLEDFound = false
			let greenLEDFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					if (bytecode[i + 1] === MAX_LED_BRIGHTNESS && bytecode[i + 2] === 0 && bytecode[i + 3] === 0) {
						redLEDFound = true
					} else if (bytecode[i + 1] === 0 && bytecode[i + 2] === MAX_LED_BRIGHTNESS && bytecode[i + 3] === 0) {
						greenLEDFound = true
					}
				}
			}

			expect(redLEDFound).toBe(true)
			expect(greenLEDFound).toBe(true)
		})

		test("should parse if statement with right proximity detection", () => {
			const code = `if (right_distance_sensor.is_object_near()) {
				all_leds.set_color(BLUE);
			}`

			const bytecode = CppParser.cppToByte(code)

			// Find READ_SENSOR instruction for right proximity
			let sensorReadFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
					bytecode[i + 1] === SensorType.SIDE_RIGHT_PROXIMITY) {
					sensorReadFound = true
					break
				}
			}

			expect(sensorReadFound).toBe(true)

			// Check for blue LED in true branch
			let blueLEDFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS &&
					bytecode[i + 1] === 0 && bytecode[i + 2] === 0 && bytecode[i + 3] === MAX_LED_BRIGHTNESS) {
					blueLEDFound = true
					break
				}
			}

			expect(blueLEDFound).toBe(true)
		})
	})

	describe("Color Sensor Detection", () => {
		const colorTestCases = [
			{ color: "RED" },
			{ color: "GREEN" },
			{ color: "BLUE" },
			{ color: "WHITE" },
			{ color: "BLACK" }
		]

		colorTestCases.forEach(({ color }) => {
			test(`should parse if statement with ${color} color detection`, () => {
				const code = `if (color_sensor.is_object(${color})) {
					all_leds.set_color(RED);
				}`

				const bytecode = CppParser.cppToByte(code)

				// Find READ_SENSOR instruction for color sensor
				let sensorReadFound = false
				let compareFound = false
				let jumpIfFalseFound = false

				// Map color to expected sensor type
				const expectedSensorType = {
					"RED": SensorType.SENSOR_COLOR_RED,
					"GREEN": SensorType.SENSOR_COLOR_GREEN,
					"BLUE": SensorType.SENSOR_COLOR_BLUE,
					"WHITE": SensorType.SENSOR_COLOR_WHITE,
					"BLACK": SensorType.SENSOR_COLOR_BLACK
				}[color]

				for (let i = 0; i < bytecode.length; i += 5) {
					if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
						bytecode[i + 1] === expectedSensorType) {
						sensorReadFound = true
					} else if (bytecode[i] === BytecodeOpCode.COMPARE &&
							  bytecode[i + 1] === ComparisonOp.EQUAL &&
							  bytecode[i + 3] === 1) { // Comparing with true (1)
						compareFound = true
					} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
						jumpIfFalseFound = true
					}
				}

				expect(sensorReadFound).toBe(true)
				expect(compareFound).toBe(true)
				expect(jumpIfFalseFound).toBe(true)

				// Check for red LED in true branch
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
		})

		test("should parse if-else statement with color detection", () => {
			const code = `if (color_sensor.is_object(RED)) {
				all_leds.set_color(RED);
			} else {
				all_leds.set_color(GREEN);
			}`

			const bytecode = CppParser.cppToByte(code)

			// Find READ_SENSOR instruction for color sensor
			let sensorReadFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
					bytecode[i + 1] === SensorType.SENSOR_COLOR_RED) {
					sensorReadFound = true
					break
				}
			}

			expect(sensorReadFound).toBe(true)

			// Check for both LED colors
			let redLEDFound = false
			let greenLEDFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					if (bytecode[i + 1] === MAX_LED_BRIGHTNESS && bytecode[i + 2] === 0 && bytecode[i + 3] === 0) {
						redLEDFound = true
					} else if (bytecode[i + 1] === 0 && bytecode[i + 2] === MAX_LED_BRIGHTNESS && bytecode[i + 3] === 0) {
						greenLEDFound = true
					}
				}
			}

			expect(redLEDFound).toBe(true)
			expect(greenLEDFound).toBe(true)
		})

		test("should parse compound condition with color detection", () => {
			const code = `if ((color_sensor.is_object(RED)) && (imu.getPitch() > 10)) {
				all_leds.set_color(WHITE);
			}`

			const bytecode = CppParser.cppToByte(code)

			// Should have two READ_SENSOR instructions
			let colorSensorFound = false
			let pitchSensorFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.SENSOR_COLOR_RED) {
						colorSensorFound = true
					} else if (bytecode[i + 1] === SensorType.PITCH) {
						pitchSensorFound = true
					}
				}
			}

			expect(colorSensorFound).toBe(true)
			expect(pitchSensorFound).toBe(true)

			// Should have two COMPARE instructions and two JUMP_IF_FALSE instructions
			let compareCount = 0
			let jumpIfFalseCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				}
			}

			expect(compareCount).toBe(2)
			expect(jumpIfFalseCount).toBe(2) // Short-circuit logic for AND
		})

		test("should handle color detection in variable assignment", () => {
			const code = "bool colorDetected = color_sensor.is_object(BLUE);"

			const bytecode = CppParser.cppToByte(code)

			// Should have DECLARE_VAR, READ_SENSOR
			let declareVarFound = false
			let readSensorFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarFound = true
				} else if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
						   bytecode[i + 1] === SensorType.SENSOR_COLOR_BLUE) {
					readSensorFound = true
				}
			}

			expect(declareVarFound).toBe(true)
			expect(readSensorFound).toBe(true)
		})

		test("should parse if statement with yellow color detection", () => {
			const code = `if (color_sensor.is_object(YELLOW)) {
				all_leds.set_color(YELLOW);
			}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.SENSOR_COLOR_YELLOW)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.EQUAL)
			expect(bytecode[7]).toBe(0x8000) // Register reference
			expect(bytecode[8]).toBe(1) // Right value
			expect(bytecode[9]).toBe(0) // Unused
			expect(bytecode[10]).toBe(51) // Unused
			expect(bytecode[11]).toBe(40) // Unused
		})
	})

	describe("TOF Distance Sensor", () => {
		test("should parse TOF distance in variable assignment", () => {
			const code = "float distance = front_distance_sensor.get_distance();"

			const bytecode = CppParser.cppToByte(code)

			// Should have DECLARE_VAR, READ_SENSOR with FRONT_TOF_DISTANCE, END
			let declareVarFound = false
			let readSensorFound = false
			let endFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.DECLARE_VAR) {
					declareVarFound = true
				} else if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
						   bytecode[i + 1] === SensorType.FRONT_TOF_DISTANCE) {
					readSensorFound = true
				} else if (bytecode[i] === BytecodeOpCode.END) {
					endFound = true
				}
			}

			expect(declareVarFound).toBe(true)
			expect(readSensorFound).toBe(true)
			expect(endFound).toBe(true)
		})

		test("should parse TOF distance in if statement comparison", () => {
			const code = `if (front_distance_sensor.get_distance() > 50) {
				all_leds.set_color(GREEN);
			}`

			const bytecode = CppParser.cppToByte(code)

			// Should have READ_SENSOR, COMPARE, JUMP_IF_FALSE
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.FRONT_TOF_DISTANCE)
			expect(bytecode[2]).toBe(0) // Register ID
			expect(bytecode[3]).toBe(0) // Unused
			expect(bytecode[4]).toBe(0) // Unused

			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[7]).toBe(0x8000) // Register reference
			expect(bytecode[8]).toBe(50) // Right value
			expect(bytecode[9]).toBe(0) // Unused
		})

		test("should parse TOF distance with different comparison operators", () => {
			const testCases = [
				{
					code: "if (front_distance_sensor.get_distance() < 20) { all_leds.set_color(RED); }",
					operator: ComparisonOp.LESS_THAN, value: 20
				},
				{
					code: "if (front_distance_sensor.get_distance() == 100) { all_leds.set_color(BLUE); }",
					operator: ComparisonOp.EQUAL, value: 100
				},
				{
					code: "if (front_distance_sensor.get_distance() != 0) { all_leds.set_color(WHITE); }",
					operator: ComparisonOp.NOT_EQUAL, value: 0
				},
				{
					code: "if (front_distance_sensor.get_distance() >= 75) { all_leds.set_color(PURPLE); }",
				  	operator: ComparisonOp.GREATER_EQUAL, value: 75
				},
				{
					code: "if (front_distance_sensor.get_distance() <= 25) { all_leds.set_color(YELLOW); }",
					operator: ComparisonOp.LESS_EQUAL, value: 25
				}
			]

			testCases.forEach(({ code, operator, value }) => {
				const bytecode = CppParser.cppToByte(code)

				expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
				expect(bytecode[1]).toBe(SensorType.FRONT_TOF_DISTANCE)
				expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
				expect(bytecode[6]).toBe(operator)
				expect(bytecode[7]).toBe(0x8000) // Register reference
				expect(bytecode[8]).toBe(value) // Right value
			})
		})

		test("should parse compound condition with TOF distance and other sensor", () => {
			const code = `if ((front_distance_sensor.get_distance() > 30) && (imu.getPitch() < 45)) {
				all_leds.set_color(WHITE);
			}`

			const bytecode = CppParser.cppToByte(code)

			// Should have two READ_SENSOR instructions
			let tofSensorFound = false
			let pitchSensorFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
					if (bytecode[i + 1] === SensorType.FRONT_TOF_DISTANCE) {
						tofSensorFound = true
					} else if (bytecode[i + 1] === SensorType.PITCH) {
						pitchSensorFound = true
					}
				}
			}

			expect(tofSensorFound).toBe(true)
			expect(pitchSensorFound).toBe(true)

			// Should have two COMPARE instructions and two JUMP_IF_FALSE instructions
			let compareCount = 0
			let jumpIfFalseCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.COMPARE) {
					compareCount++
				} else if (bytecode[i] === BytecodeOpCode.JUMP_IF_FALSE) {
					jumpIfFalseCount++
				}
			}

			expect(compareCount).toBe(2)
			expect(jumpIfFalseCount).toBe(2) // Short-circuit logic for AND
		})

		test("should parse if-else statement with TOF distance", () => {
			const code = `if (front_distance_sensor.get_distance() > 100) {
				all_leds.set_color(GREEN);
			} else {
				all_leds.set_color(RED);
			}`

			const bytecode = CppParser.cppToByte(code)

			// Find READ_SENSOR instruction for TOF distance
			let sensorReadFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
					bytecode[i + 1] === SensorType.FRONT_TOF_DISTANCE) {
					sensorReadFound = true
					break
				}
			}

			expect(sensorReadFound).toBe(true)

			// Check for both LED colors
			let redLEDFound = false
			let greenLEDFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.SET_ALL_LEDS) {
					if (bytecode[i + 1] === MAX_LED_BRIGHTNESS && bytecode[i + 2] === 0 && bytecode[i + 3] === 0) {
						redLEDFound = true
					} else if (bytecode[i + 1] === 0 && bytecode[i + 2] === MAX_LED_BRIGHTNESS && bytecode[i + 3] === 0) {
						greenLEDFound = true
					}
				}
			}

			expect(redLEDFound).toBe(true)
			expect(greenLEDFound).toBe(true)
		})
	})
})
