/* eslint-disable max-lines-per-function */
import CppParser from "../../../../src/classes/cpp-parser"
import { BytecodeOpCode, ComparisonOp, SensorType } from "../../../../src/types/bytecode-types"
import { MAX_LED_BRIGHTNESS } from "../../../../src/utils/constants"

describe("Control flow", () => {
	test("should parse basic if-else statement", () => {
		const code = `
			if (5 > 10) {
				rgbLed.set_led_white();
			} else {
				rgbLed.set_led_red();
			}
			delay(1000);
			rgbLed.set_led_green();
		`

		const bytecode = CppParser.cppToByte(code)

		// 1. Compare operation
		expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[1]).toBe(ComparisonOp.GREATER_THAN)
		expect(bytecode[2]).toBe(5)  // Left value
		expect(bytecode[3]).toBe(10) // Right value
		expect(bytecode[4]).toBe(0)  // Unused

		// 2. Jump if false to else block (3 instructions ahead: 3 * 20 = 60 bytes)
		expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[6]).toBe(60)

		// 3. Set LEDs white (true branch)
		expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[11]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[12]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[13]).toBe(MAX_LED_BRIGHTNESS) // B

		// 4. Unconditional jump to skip else block (5 instructions ahead: 5 * 20 = 100 bytes)
		expect(bytecode[15]).toBe(BytecodeOpCode.JUMP)
		expect(bytecode[16]).toBe(40)

		// 5. Set LEDs red (false branch)
		expect(bytecode[20]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[21]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[22]).toBe(0)   // G
		expect(bytecode[23]).toBe(0)   // B

		// 6. Delay instruction
		expect(bytecode[25]).toBe(BytecodeOpCode.DELAY)
		expect(bytecode[26]).toBe(1000) // 1000ms

		// 7. Set LEDs green
		expect(bytecode[30]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[31]).toBe(0)   // R
		expect(bytecode[32]).toBe(MAX_LED_BRIGHTNESS) // G
		expect(bytecode[33]).toBe(0)   // B

		// 8. End instruction
		expect(bytecode[35]).toBe(BytecodeOpCode.END)
		expect(bytecode[36]).toBe(0)
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
		expect(bytecode[2]).toBe(3)
		expect(bytecode[3]).toBe(7)
		expect(bytecode[4]).toBe(0)

		// 2. Jump if false to skip if block (2 instructions ahead: 2 * 20 = 40 bytes)
		expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[6]).toBe(40)

		// 3. Set LEDs blue
		expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[11]).toBe(0)   // R
		expect(bytecode[12]).toBe(0)   // G
		expect(bytecode[13]).toBe(MAX_LED_BRIGHTNESS) // B

		// 4. Set LEDs purple
		expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[16]).toBe(MAX_LED_BRIGHTNESS) // R
		expect(bytecode[17]).toBe(0)   // G
		expect(bytecode[18]).toBe(MAX_LED_BRIGHTNESS) // B

		// 5. End instruction
		const endIndex = bytecode.length - 5
		expect(bytecode[endIndex]).toBe(BytecodeOpCode.END)
		expect(bytecode[endIndex + 1]).toBe(0)
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
		expect(bytecode[2]).toBe(10)
		expect(bytecode[3]).toBe(10)
		expect(bytecode[4]).toBe(0)

		// 2. Jump if false to outer else (7 instructions ahead: 7 * 20 = 140 bytes)
		expect(bytecode[5]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
		expect(bytecode[6]).toBe(140)

		// 3. Second compare operation (inner if)
		expect(bytecode[10]).toBe(BytecodeOpCode.COMPARE)
		expect(bytecode[11]).toBe(ComparisonOp.NOT_EQUAL)
		expect(bytecode[12]).toBe(5)
		expect(bytecode[13]).toBe(5)
		expect(bytecode[14]).toBe(0)

		// Verify end instruction
		expect(bytecode[bytecode.length - 5]).toBe(BytecodeOpCode.END)
		expect(bytecode[bytecode.length - 4]).toBe(0)
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

			expect(bytecode[0]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[1]).toBe(test.op)
			expect(bytecode[2]).toBe(5)
			expect(bytecode[3]).toBe(5)
			expect(bytecode[4]).toBe(0)
		}
	})

	describe("Control flow error handling", () => {
		test("should reject unsupported comparison operator", () => {
			expect(() => {
				CppParser.cppToByte("if (5 = 10) { rgbLed.set_led_red(); }")
			}).toThrow(/Unsupported operator/)
		})

		test("should reject invalid command for malformed if statement", () => {
			expect(() => {
				CppParser.cppToByte("if (5 <> 10) { rgbLed.set_led_red(); }")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Complex Sensor Usage", () => {
		test("should handle sensors in if-else branches", () => {
			const code = `if (Sensors::getInstance().getPitch() > 20) {
				rgbLed.set_led_red();
			} else {
				if (Sensors::getInstance().getRoll() < -10) {
					rgbLed.set_led_blue();
				} else {
					rgbLed.set_led_green();
				}
			}`

			const bytecode = CppParser.cppToByte(code)

			// 1. READ_SENSOR (Pitch)
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.PITCH)
			expect(bytecode[2]).toBe(0) // Register

			// 2. COMPARE (Pitch > 20)
			expect(bytecode[5]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[6]).toBe(ComparisonOp.GREATER_THAN)
			expect(bytecode[7]).toBe(32768) // Register reference (0x8000)
			expect(bytecode[8]).toBe(20)

			// 3. JUMP_IF_FALSE (to outer else, 3 instructions ahead: 3 * 20 = 60 bytes)
			expect(bytecode[10]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
			expect(bytecode[11]).toBe(60)

			// 4. SET_ALL_LEDS (red)
			expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[16]).toBe(255) // R
			expect(bytecode[17]).toBe(0)   // G
			expect(bytecode[18]).toBe(0)   // B

			// 5. JUMP (skip inner if-else, 7 instructions ahead: 7 * 20 = 140 bytes)
			expect(bytecode[20]).toBe(BytecodeOpCode.JUMP)
			expect(bytecode[21]).toBe(140)

			// 6. READ_SENSOR (Roll)
			expect(bytecode[25]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[26]).toBe(SensorType.ROLL)
			expect(bytecode[27]).toBe(1) // Register

			// 7. COMPARE (Roll < -10)
			expect(bytecode[30]).toBe(BytecodeOpCode.COMPARE)
			expect(bytecode[31]).toBe(ComparisonOp.LESS_THAN)
			expect(bytecode[32]).toBe(32769) // Register reference (0x8000 | 1)
			expect(bytecode[33]).toBe(-10)

			// 8. JUMP_IF_FALSE (to inner else, 3 instructions ahead: 3 * 20 = 60 bytes)
			expect(bytecode[35]).toBe(BytecodeOpCode.JUMP_IF_FALSE)
			expect(bytecode[36]).toBe(60)

			// 9. SET_ALL_LEDS (blue)
			expect(bytecode[40]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[41]).toBe(0)   // R
			expect(bytecode[42]).toBe(0)   // G
			expect(bytecode[43]).toBe(255) // B

			// 10. JUMP (skip inner else, 2 instructions ahead: 2 * 20 = 40 bytes)
			expect(bytecode[45]).toBe(BytecodeOpCode.JUMP)
			expect(bytecode[46]).toBe(40)

			// 11. SET_ALL_LEDS (green)
			expect(bytecode[50]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[51]).toBe(0)   // R
			expect(bytecode[52]).toBe(255) // G
			expect(bytecode[53]).toBe(0)   // B

			// 12. END
			expect(bytecode[55]).toBe(BytecodeOpCode.END)
			expect(bytecode[56]).toBe(0)
		})

		test("should handle sensors in loops", () => {
			const code = `while (true) {
			if (Sensors::getInstance().getAccelMagnitude() > 5) {
				rgbLed.set_led_white();
			}
			delay(100);
		}`

			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.WHILE_START)
			expect(bytecode[5]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[6]).toBe(SensorType.ACCEL_MAG)
		})

		// TODO: Test isn't running
		test("should handle sensors in for loops", () => {
			const code = `for (int i = 0; i < 10; i++) {
			if (Sensors::getInstance().getYaw() > i) {
				rgbLed.set_led_red();
			}
		}`

			const bytecode = CppParser.cppToByte(code)

			let sensorIndex = -1
			for (let i = 15; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.READ_SENSOR && bytecode[i + 1] === SensorType.YAW) {
					sensorIndex = i
					break
				}
			}
			expect(sensorIndex).toBeGreaterThan(0)
		})
	})
})
