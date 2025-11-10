import { ToneType } from "@lever-labs/common-ts/protocol"
import { CppParser } from "@/parser/cpp-parser"
import { BytecodeOpCode } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

describe("Speaker commands", () => {
	describe("play_tone command", () => {
		test("should parse play_tone with A", () => {
			const bytecode = CppParser.cppToByte("speaker.play_tone(\"A\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.A)
			expect(bytecode[2]).toBe(0)
			expect(bytecode[3]).toBe(0)
			expect(bytecode[4]).toBe(0)
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should parse play_tone with B", () => {
			const bytecode = CppParser.cppToByte("speaker.play_tone(\"B\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.B)
			expect(bytecode[2]).toBe(0)
			expect(bytecode[3]).toBe(0)
			expect(bytecode[4]).toBe(0)
		})

		test("should parse play_tone with C", () => {
			const bytecode = CppParser.cppToByte("speaker.play_tone(\"C\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.C)
		})

		test("should parse play_tone with D", () => {
			const bytecode = CppParser.cppToByte("speaker.play_tone(\"D\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.D)
		})

		test("should parse play_tone with E", () => {
			const bytecode = CppParser.cppToByte("speaker.play_tone(\"E\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.E)
		})

		test("should parse play_tone with F", () => {
			const bytecode = CppParser.cppToByte("speaker.play_tone(\"F\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.F)
		})

		test("should parse play_tone with G", () => {
			const bytecode = CppParser.cppToByte("speaker.play_tone(\"G\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.G)
		})

		test("should handle case-insensitive tone names", () => {
			const bytecode1 = CppParser.cppToByte("speaker.play_tone(\"a\");")
			const bytecode2 = CppParser.cppToByte("speaker.play_tone(\"A\");")
			const bytecode3 = CppParser.cppToByte("speaker.play_tone(\"c\");")

			expect(bytecode1[1]).toBe(ToneType.A)
			expect(bytecode2[1]).toBe(ToneType.A)
			expect(bytecode3[1]).toBe(ToneType.C)
		})

		test("should parse multiple play_tone commands", () => {
			const program = `
				speaker.play_tone("A");
				speaker.play_tone("B");
				speaker.play_tone("C");
			`

			const bytecode = CppParser.cppToByte(program)

			// First instruction: PLAY_TONE (A)
			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[1]).toBe(ToneType.A)

			// Second instruction: PLAY_TONE (B)
			expect(bytecode[5]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[6]).toBe(ToneType.B)

			// Third instruction: PLAY_TONE (C)
			expect(bytecode[10]).toBe(BytecodeOpCode.PLAY_TONE)
			expect(bytecode[11]).toBe(ToneType.C)

			// Last instruction: END
			expect(bytecode[15]).toBe(BytecodeOpCode.END)
		})

		test("should parse play_tone in conditional statements", () => {
			const code = `
				if (10 > 5) {
					speaker.play_tone("A");
				} else {
					speaker.play_tone("B");
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Find the PLAY_TONE instructions
			let toneAIndex = -1
			let toneBIndex = -1

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.PLAY_TONE) {
					if (bytecode[i + 1] === ToneType.A) {
						toneAIndex = i
					} else if (bytecode[i + 1] === ToneType.B) {
						toneBIndex = i
					}
				}
			}

			expect(toneAIndex).toBeGreaterThan(0)
			expect(toneBIndex).toBeGreaterThan(0)
			expect(toneAIndex).toBeLessThan(toneBIndex)
		})

		test("should parse play_tone in loops", () => {
			const code = `
				for (int i = 0; i < 3; i++) {
					speaker.play_tone("C");
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Find the PLAY_TONE instruction
			let toneCFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.PLAY_TONE && bytecode[i + 1] === ToneType.C) {
					toneCFound = true
					break
				}
			}

			expect(toneCFound).toBe(true)
		})

		test("should combine play_tone with other commands", () => {
			const program = `
				all_leds.set_color(RED);
				speaker.play_tone("A");
				wait(1);
				all_leds.set_color(OFF);
				speaker.play_tone("B");
			`

			const bytecode = CppParser.cppToByte(program)

			// Check for specific instruction sequence
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS) // Red LED
			expect(bytecode[5]).toBe(BytecodeOpCode.PLAY_TONE)   // A
			expect(bytecode[6]).toBe(ToneType.A)
			expect(bytecode[10]).toBe(BytecodeOpCode.WAIT)       // Wait
			expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS) // LED off
			expect(bytecode[20]).toBe(BytecodeOpCode.PLAY_TONE)   // B
			expect(bytecode[21]).toBe(ToneType.B)
		})
	})

	describe("play_tone error handling", () => {
		test("should reject invalid tone name", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_tone(\"InvalidTone\");")
			}).toThrow(/Invalid tone name: "InvalidTone"/)
		})

		test("should reject empty tone name", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_tone(\"\");")
			}).toThrow(/Invalid tone name: ""/)
		})

		test("should reject tone name with wrong case for invalid tones", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_tone(\"h\");")
			}).toThrow(/Invalid tone name: "h"/)
		})

		test("should provide helpful error message with valid tone names", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_tone(\"WrongTone\");")
			}).toThrow(/Valid tones are: A, B, C, D, E, F, G/)
		})

		test("should reject malformed play_tone syntax", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_tone();")
			}).toThrow(/Invalid command/)
		})

		test("should reject play_tone with number instead of string", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_tone(123);")
			}).toThrow(/Invalid command/)
		})

		test("should reject play_tone with multiple parameters", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_tone(\"A\", \"B\");")
			}).toThrow(/Invalid command/)
		})
	})
})
