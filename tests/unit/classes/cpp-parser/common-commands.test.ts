/* eslint-disable max-lines-per-function */
import CppParser from "../../../../src/classes/cpp-parser"
import { MAX_LED_BRIGHTNESS } from "../../../../src/utils/constants"
import { BytecodeOpCode, CommandType, LedID, VarType } from "../../../../src/types/bytecode-types"

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
