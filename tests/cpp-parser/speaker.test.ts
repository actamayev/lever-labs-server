import { SoundType, ToneType } from "@lever-labs/common-ts/protocol"
import { CppParser } from "parser/cpp-parser"
import { BytecodeOpCode } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

describe("Speaker commands", () => {
	describe("play_sound command", () => {
		test("should parse play_sound with Chime", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Chime\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.CHIME)
			expect(bytecode[2]).toBe(0)
			expect(bytecode[3]).toBe(0)
			expect(bytecode[4]).toBe(0)
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should parse play_sound with Chirp", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Chirp\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.CHIRP)
			expect(bytecode[2]).toBe(0)
			expect(bytecode[3]).toBe(0)
			expect(bytecode[4]).toBe(0)
		})

		test("should parse play_sound with Pop", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Pop\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.POP)
		})

		test("should parse play_sound with Drop", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Drop\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.DROP)
		})

		test("should parse play_sound with Fart", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Fart\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.FART)
		})

		test("should parse play_sound with Monkey", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Monkey\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.MONKEY)
		})

		test("should parse play_sound with Elephant", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Elephant\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.ELEPHANT)
		})

		test("should parse play_sound with Party", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Party\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.PARTY)
		})

		test("should parse play_sound with UFO", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"UFO\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.UFO)
		})

		test("should parse play_sound with Countdown", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Countdown\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.COUNTDOWN)
		})

		test("should parse play_sound with Engine", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Engine\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.ENGINE)
		})

		test("should parse play_sound with Robot", () => {
			const bytecode = CppParser.cppToByte("speaker.play_sound(\"Robot\");")

			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.ROBOT)
		})

		test("should handle case-insensitive sound names", () => {
			const bytecode1 = CppParser.cppToByte("speaker.play_sound(\"chime\");")
			const bytecode2 = CppParser.cppToByte("speaker.play_sound(\"CHIME\");")
			const bytecode3 = CppParser.cppToByte("speaker.play_sound(\"ChImE\");")

			expect(bytecode1[1]).toBe(SoundType.CHIME)
			expect(bytecode2[1]).toBe(SoundType.CHIME)
			expect(bytecode3[1]).toBe(SoundType.CHIME)
		})

		test("should parse multiple play_sound commands", () => {
			const program = `
				speaker.play_sound("Chime");
				speaker.play_sound("Chirp");
				speaker.play_sound("Pop");
			`

			const bytecode = CppParser.cppToByte(program)

			// First instruction: PLAY_SOUND (Chime)
			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[1]).toBe(SoundType.CHIME)

			// Second instruction: PLAY_SOUND (Chirp)
			expect(bytecode[5]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[6]).toBe(SoundType.CHIRP)

			// Third instruction: PLAY_SOUND (Pop)
			expect(bytecode[10]).toBe(BytecodeOpCode.PLAY_SOUND)
			expect(bytecode[11]).toBe(SoundType.POP)

			// Last instruction: END
			expect(bytecode[15]).toBe(BytecodeOpCode.END)
		})

		test("should parse play_sound in conditional statements", () => {
			const code = `
				if (10 > 5) {
					speaker.play_sound("Party");
				} else {
					speaker.play_sound("Drop");
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Find the PLAY_SOUND instructions
			let partyIndex = -1
			let dropIndex = -1

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.PLAY_SOUND) {
					if (bytecode[i + 1] === SoundType.PARTY) {
						partyIndex = i
					} else if (bytecode[i + 1] === SoundType.DROP) {
						dropIndex = i
					}
				}
			}

			expect(partyIndex).toBeGreaterThan(0)
			expect(dropIndex).toBeGreaterThan(0)
			expect(partyIndex).toBeLessThan(dropIndex)
		})

		test("should parse play_sound in loops", () => {
			const code = `
				for (int i = 0; i < 3; i++) {
					speaker.play_sound("Robot");
				}
			`

			const bytecode = CppParser.cppToByte(code)

			// Find the PLAY_SOUND instruction
			let robotSoundFound = false
			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.PLAY_SOUND && bytecode[i + 1] === SoundType.ROBOT) {
					robotSoundFound = true
					break
				}
			}

			expect(robotSoundFound).toBe(true)
		})

		test("should combine play_sound with other commands", () => {
			const program = `
				all_leds.set_color(RED);
				speaker.play_sound("Chime");
				wait(1);
				all_leds.set_color(OFF);
				speaker.play_sound("Drop");
			`

			const bytecode = CppParser.cppToByte(program)

			// Check for specific instruction sequence
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS) // Red LED
			expect(bytecode[5]).toBe(BytecodeOpCode.PLAY_SOUND)   // Chime
			expect(bytecode[6]).toBe(SoundType.CHIME)
			expect(bytecode[10]).toBe(BytecodeOpCode.WAIT)       // Wait
			expect(bytecode[15]).toBe(BytecodeOpCode.SET_ALL_LEDS) // LED off
			expect(bytecode[20]).toBe(BytecodeOpCode.PLAY_SOUND)   // Drop
			expect(bytecode[21]).toBe(SoundType.DROP)
		})
	})

	describe("play_sound error handling", () => {
		test("should reject invalid sound name", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_sound(\"InvalidSound\");")
			}).toThrow(/Invalid sound name: "InvalidSound"/)
		})

		test("should reject empty sound name", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_sound(\"\");")
			}).toThrow(/Invalid sound name: ""/)
		})

		test("should reject sound name with wrong case for invalid sounds", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_sound(\"beep\");")
			}).toThrow(/Invalid sound name: "beep"/)
		})

		test("should provide helpful error message with valid sound names", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_sound(\"WrongName\");")
			}).toThrow(/Valid sounds are: CHIME, CHIRP, POP, DROP, FART, MONKEY, ELEPHANT, PARTY, UFO, COUNTDOWN, ENGINE, ROBOT/)
		})

		test("should reject malformed play_sound syntax", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_sound();")
			}).toThrow(/Invalid command/)
		})

		test("should reject play_sound with number instead of string", () => {
			expect(() => {
				CppParser.cppToByte("speaker.play_sound(123);")
			}).toThrow(/Invalid command/)
		})
	})

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

		test("should combine play_tone with play_sound", () => {
			const program = `
				speaker.play_tone("A");
				speaker.play_sound("Chime");
				speaker.play_tone("B");
			`

			const bytecode = CppParser.cppToByte(program)

			// Check for specific instruction sequence
			expect(bytecode[0]).toBe(BytecodeOpCode.PLAY_TONE)   // A
			expect(bytecode[1]).toBe(ToneType.A)
			expect(bytecode[5]).toBe(BytecodeOpCode.PLAY_SOUND)  // Chime
			expect(bytecode[6]).toBe(SoundType.CHIME)
			expect(bytecode[10]).toBe(BytecodeOpCode.PLAY_TONE)  // B
			expect(bytecode[11]).toBe(ToneType.B)
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
