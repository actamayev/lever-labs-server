/* eslint-disable max-lines-per-function */
import CppParser from "../../src/classes/cpp-parser"
import { BytecodeOpCode, ComparisonOp, SensorType } from "../../src/types/bytecode-types"

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
