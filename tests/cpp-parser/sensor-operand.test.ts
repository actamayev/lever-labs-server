import { CppParser } from "@/parser/cpp-parser"
import { BytecodeOpCode, ComparisonOp, SensorType } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

describe("Sensor Operand Processing", () => {
	test("should handle sensors as left operands in comparisons", () => {
		const code = `
      if (imu.getPitch() > 10) {
        all_leds.set_color(RED);
      }
    `

		const bytecode = CppParser.cppToByte(code)

		// First instruction should be READ_SENSOR for pitch
		expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
		expect(bytecode[1]).toBe(SensorType.PITCH)
		expect(bytecode[2]).toBe(0) // Register 0

		// Second instruction should be COMPARE with high bit set in left operand
		expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[6]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[7]).toBe(0x8000) // Register 0 with high bit set
		expect(bytecode[8]).toBe(10) // Constant value
	})

	test("should handle sensors as right operands in comparisons", () => {
		const code = `
      if (10 < imu.getRoll()) {
        all_leds.set_color(GREEN);
      }
    `

		const bytecode = CppParser.cppToByte(code)

		// First instruction should be READ_SENSOR for roll
		expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
		expect(bytecode[1]).toBe(SensorType.ROLL)
		expect(bytecode[2]).toBe(0) // Register 0

		// Second instruction should be COMPARE with high bit set in right operand
		expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[6]).toBe(ComparisonOp.LESS_THAN)
		expect(bytecode[7]).toBe(10) // Constant value
		expect(bytecode[8]).toBe(0x8000) // Register 0 with high bit set
	})

	test("should handle multiple different sensor types in sequence", () => {
		const code = `
      if (imu.getPitch() > 10) {
        all_leds.set_color(RED);
      }
      
      if (imu.getRoll() < -5) {
        all_leds.set_color(GREEN);
      }
      
      if (imu.getYaw() == 0) {
        all_leds.set_color(BLUE);
      }
    `

		const bytecode = CppParser.cppToByte(code)

		// Should have READ_SENSOR instructions for all three sensor types
		let pitchFound = false
		let rollFound = false
		let yawFound = false

		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
				if (bytecode[i + 1] === SensorType.PITCH) {
					pitchFound = true
				} else if (bytecode[i + 1] === SensorType.ROLL) {
					rollFound = true
				} else if (bytecode[i + 1] === SensorType.YAW) {
					yawFound = true
				}
			}
		}

		expect(pitchFound).toBe(true)
		expect(rollFound).toBe(true)
		expect(yawFound).toBe(true)

		// Should use different registers for each sensor
		const registers = new Set()
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR) {
				registers.add(bytecode[i + 2]) // Register ID
			}
		}

		expect(registers.size).toBe(3) // Should have 3 different registers
	})

	test("should handle all sensor types in comparisons", () => {
		const sensorMethods = [
			{ method: "getPitch", type: SensorType.PITCH },
			{ method: "getRoll", type: SensorType.ROLL },
			{ method: "getYaw", type: SensorType.YAW },
			{ method: "getXAccel", type: SensorType.ACCEL_X },
			{ method: "getYAccel", type: SensorType.ACCEL_Y },
			{ method: "getZAccel", type: SensorType.ACCEL_Z },
			{ method: "getAccelMagnitude", type: SensorType.ACCEL_MAG },
			{ method: "getXRotationRate", type: SensorType.ROT_RATE_X },
			{ method: "getYRotationRate", type: SensorType.ROT_RATE_Y },
			{ method: "getZRotationRate", type: SensorType.ROT_RATE_Z },
			{ method: "getMagneticFieldX", type: SensorType.MAG_FIELD_X },
			{ method: "getMagneticFieldY", type: SensorType.MAG_FIELD_Y },
			{ method: "getMagneticFieldZ", type: SensorType.MAG_FIELD_Z }
		]

		for (const { method, type } of sensorMethods) {
			const code = `if (imu.${method}() > 0) { all_leds.set_color(RED); }`
			const bytecode = CppParser.cppToByte(code)

			// First instruction should be READ_SENSOR with correct sensor type
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(type)
			expect(bytecode[2]).toBe(0) // Register 0

			// Second instruction should be COMPARE
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[7]).toBe(0x8000) // Register 0 with high bit set
			expect(bytecode[8]).toBe(0) // Constant value
		}
	})

	test("should throw error when registers are exhausted", () => {
		// Create code that uses up all registers
		const registerSetup = Array(512).fill(null).map((_, i) =>
			`float var${i} = 0.0;`
		).join("\n")

		const code = `
      ${registerSetup}
      if (imu.getPitch() > 0) {
        all_leds.set_color(RED);
      }
    `

		// Should throw error about exceeding register count
		expect(() => {
			CppParser.cppToByte(code)
		}).toThrow(/exceeds maximum register count/)
	})

	test("should handle sensor comparison with multiple operators", () => {
		const operators = [
			{ op: ">", compOp: ComparisonOp.GREATER_THAN },
			{ op: "<", compOp: ComparisonOp.LESS_THAN },
			{ op: ">=", compOp: ComparisonOp.GREATER_EQUAL },
			{ op: "<=", compOp: ComparisonOp.LESS_EQUAL },
			{ op: "==", compOp: ComparisonOp.EQUAL },
			{ op: "!=", compOp: ComparisonOp.NOT_EQUAL }
		]

		for (const { op, compOp } of operators) {
			const code = `if (imu.getPitch() ${op} 0) { all_leds.set_color(RED); }`
			const bytecode = CppParser.cppToByte(code)

			// Second instruction should be COMPARE with correct operator
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(compOp)
			expect(bytecode[7]).toBe(0x8000) // Register 0 with high bit set
		}
	})

	test("should handle sensor comparison with variables", () => {
		const code = `
      float threshold = 10.5;
      if (imu.getPitch() > threshold) {
        all_leds.set_color(RED);
      }
    `

		const bytecode = CppParser.cppToByte(code)

		// Should have DECLARE_VAR and SET_VAR for threshold
		expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
		expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
		expect(bytecode[7]).toBeCloseTo(10.5) // Variable value

		// Should have READ_SENSOR for pitch
		expect(bytecode[10]).toBe(BytecodeOpCode.READ_SENSOR)
		expect(bytecode[11]).toBe(SensorType.PITCH)
		expect(bytecode[12]).toBe(1) // Register 1 (after threshold in register 0)

		// Should have COMPARE with both operands as register references
		expect(bytecode[15]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[16]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[17]).toBe(0x8001) // Register 1 with high bit set
		expect(bytecode[18]).toBe(0x8000) // Register 0 with high bit set
	})

	test("should handle sensor on both sides of comparison", () => {
		const code = `
      if (imu.getPitch() > imu.getRoll()) {
        all_leds.set_color(RED);
      }
    `

		const bytecode = CppParser.cppToByte(code)

		// Should have READ_SENSOR for pitch
		expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
		expect(bytecode[1]).toBe(SensorType.PITCH)
		expect(bytecode[2]).toBe(0) // Register 0

		// Should have READ_SENSOR for roll
		expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
		expect(bytecode[6]).toBe(SensorType.ROLL)
		expect(bytecode[7]).toBe(1) // Register 1

		// Should have COMPARE with both operands as register references
		expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[11]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[12]).toBe(0x8000) // Register 0 with high bit set
		expect(bytecode[13]).toBe(0x8001) // Register 1 with high bit set
	})

	test("should handle sensors in complex expressions with loops", () => {
		const code = `
      for (int i = 0; i < 5; i++) {
        if (imu.getPitch() > i) {
          all_leds.set_color(RED);
        }
      }
    `

		const bytecode = CppParser.cppToByte(code)

		// Should have FOR_INIT for loop counter
		let forInitFound = false
		for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.FOR_INIT) {
				forInitFound = true
				break
			}
		}
		expect(forInitFound).toBe(true)

		// Should have READ_SENSOR for pitch inside the loop
		let readSensorFound = false
		for (let i = 15; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.READ_SENSOR &&
          bytecode[i + 1] === SensorType.PITCH) {
				readSensorFound = true
				break
			}
		}
		expect(readSensorFound).toBe(true)

		// Should have COMPARE between sensor and loop counter
		// Should have COMPARE between sensor and loop counter
		let compareFound = false
		for (let i = 15; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.COMPARE) {
				// Left operand should be sensor register (high bit set)
				// Right operand should be loop counter register (high bit set)
				if ((bytecode[i + 2] & 0x8000) && (bytecode[i + 3] & 0x8000)) {
					compareFound = true
					break
				}
			}
		}
		expect(compareFound).toBe(true)
	})
})
