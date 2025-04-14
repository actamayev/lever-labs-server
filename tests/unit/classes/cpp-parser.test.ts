/* eslint-disable max-lines-per-function */
import CppParser from "../../../src/classes/cpp-parser"
import { BytecodeOpCode, LedID } from "../../../src/utils/cpp/bytecode-types"

describe("CppParser", () => {
	// 1. Test garbage input
	describe("Invalid inputs", () => {
		test("should reject garbage input", () => {
			expect(() => {
				CppParser.cppToByte("absdajksd")
			}).toThrow()
		})

		test("should reject invalid C++ syntax", () => {
			expect(() => {
				CppParser.cppToByte("if (x > 5) { missing closing brace")
			}).toThrow()
		})
	})

	// 2.1 Test variable assignments
	describe("Variable assignments", () => {
		test("should parse integer variable assignment", () => {
			const bytecode = CppParser.cppToByte("int myVar = 42;")

			// Check if bytecode starts with DECLARE_VAR opcode
			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)

			// Check if SET_VAR follows the declaration
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[7]).toBe(42) // Low byte of value
		})

		test("should parse boolean variable assignment", () => {
			const bytecode = CppParser.cppToByte("bool myFlag = true;")

			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			expect(bytecode[7]).toBe(1) // 1 for true
		})

		test("should parse float variable assignment", () => {
			const bytecode = CppParser.cppToByte("float myFloat = 3.14;")

			expect(bytecode[0]).toBe(BytecodeOpCode.DECLARE_VAR)
			expect(bytecode[5]).toBe(BytecodeOpCode.SET_VAR)
			// Float parsing is more complex, so we just verify it's a valid bytecode
			expect(bytecode.length).toBeGreaterThan(10)
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
		})

		test("should parse set_all_leds_to_color command", () => {
			const bytecode = CppParser.cppToByte("set_all_leds_to_color(255, 127, 64);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(255) // R
			expect(bytecode[2]).toBe(127) // G
			expect(bytecode[3]).toBe(64)  // B
		})

		test("should parse individual LED setting", () => {
			const bytecode = CppParser.cppToByte("rgbLed.set_top_left_led(10, 20, 30);")

			expect(bytecode[0]).toBe(BytecodeOpCode.SET_LED)
			expect(bytecode[1]).toBe(LedID.TOP_LEFT)
			expect(bytecode[2]).toBe(10) // R
			expect(bytecode[3]).toBe(20) // G
			expect(bytecode[4]).toBe(30) // B
		})
	})

	// 2.3 Test delay commands
	describe("Delay commands", () => {
		test("should parse delay command", () => {
			const bytecode = CppParser.cppToByte("delay(500);")

			expect(bytecode[0]).toBe(BytecodeOpCode.DELAY)
			expect(bytecode[1]).toBe(500 & 0xFF) // Low byte
			expect(bytecode[2]).toBe((500 >> 8) & 0xFF) // High byte
		})
	})

	// 3. Test complex programs (will need to be added once implemented)
	describe("Combining multiple commands", () => {
		test("should parse a simple LED blink program", () => {
			const program = `
        rgbLed.set_led_red();
        delay(500);
        rgbLed.turn_led_off();
        delay(500);
      `

			const bytecode = CppParser.cppToByte(program)

			// Verify the program has the correct sequence
			// 1st instruction: SET_ALL_LEDS (red)
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)

			// 2nd instruction: DELAY
			expect(bytecode[5]).toBe(BytecodeOpCode.DELAY)

			// 3rd instruction: SET_ALL_LEDS (off)
			expect(bytecode[10]).toBe(BytecodeOpCode.SET_ALL_LEDS)

			// 4th instruction: DELAY
			expect(bytecode[15]).toBe(BytecodeOpCode.DELAY)

			// Last instruction should be END
			const lastIndex = bytecode.length - 5
			expect(bytecode[lastIndex]).toBe(BytecodeOpCode.END)
		})

		// Add more complex tests here as you implement conditionals and loops
	})
})
