/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */
import CppParser from "../../src/classes/cpp-parser"
import { BytecodeOpCode, CommandType } from "../../src/types/bytecode-types"

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

describe("Syntax validation", () => {
	test("should detect unclosed brackets", () => {
	  expect(() => {
			CppParser.cppToByte("if (x > 5) { rgbLed.set_led_red();")
	  }).toThrow(/Unclosed.*\{/)
	})

	test("should detect unexpected closing brackets", () => {
	  expect(() => {
			CppParser.cppToByte("if (x > 5) } rgbLed.set_led_red();")
	  }).toThrow(/Unexpected closing.*\}/)
	})

	test("should detect mismatched brackets", () => {
	  expect(() => {
			CppParser.cppToByte("if (x > 5) { rgbLed.set_led_red(); ]")
	  }).toThrow(/Expected.*\}.*but found.*\]/)
	})

	test("should handle strings with escaped characters", () => {
	  // Create a valid code pattern that contains a comment with escaped characters
	  const code = `
		// This comment has escaped quotes \\"like this\\"
		if (10 > 5) {
		  rgbLed.set_led_red();
		  /* This block comment also has escaped chars: \\", \\', \\\\ */
		  delay(100);
		}
	  `

	  // This shouldn't throw because the syntax is balanced despite the escapes
	  expect(() => {
			CppParser.cppToByte(code)
	  }).not.toThrow()
	})

	test("should handle comments with bracket characters", () => {
	  const code = `
		// This comment has {brackets} and [square brackets]
		if (10 > 5) {
		  rgbLed.set_led_red();
		  /* This block comment has {unbalanced brackets */
		  delay(100);
		}
	  `

	  // Comments with bracket characters shouldn't affect syntax validation
	  expect(() => {
			CppParser.cppToByte(code)
	  }).not.toThrow()
	})
})

describe("Code sanitization", () => {
	test("should properly protect for loop semicolons", () => {
	  const code = `
		for (int i = 0; i < 10; i++) {
		  for (int j = 0; j < 5; j++) {
			rgbLed.set_led_red();
			delay(100);
		  }
		}
	  `

	  // This complex nested loop structure should parse successfully
	  // because the for loop semicolons are protected
	  const bytecode = CppParser.cppToByte(code)

	  // Check that we have FOR_INIT instructions
	  const forInitCount = Array.from({length: bytecode.length / 5}, (_, i) => i * 5)
			.filter(i => bytecode[i] === BytecodeOpCode.FOR_INIT)
			.length

	  // Should have 2 for loops
	  expect(forInitCount).toBe(2)
	})

	test("should correctly handle else statements without whitespace", () => {
	  const code = `
		if (10 > 5) {
		  rgbLed.set_led_red();
		}else{
		  rgbLed.set_led_blue();
		}
	  `

	  // This should parse successfully with the else statement properly separated
	  const bytecode = CppParser.cppToByte(code)

	  // Verify the bytecode has JUMP instruction to skip the else block
	  let jumpIndex = -1
	  for (let i = 0; i < bytecode.length; i += 5) {
			if (bytecode[i] === BytecodeOpCode.JUMP) {
		  jumpIndex = i
		  break
			}
	  }

	  expect(jumpIndex).toBeGreaterThan(0)
	})

	test("should remove both line and block comments", () => {
	  const code = `
		// Line comment that should be removed
		rgbLed.set_led_red();
		/* Block comment
		   spanning multiple lines */
		delay(100);
	  `

	  const bytecode = CppParser.cppToByte(code)

	  // Verify the bytecode has instructions for set_led_red and delay, but not for the comments
	  expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
	  expect(bytecode[5]).toBe(BytecodeOpCode.DELAY)
	  expect(bytecode[10]).toBe(BytecodeOpCode.END)
	})

	test("should properly escape single quotes", () => {
	  const code = `
		if (10 > 5) {
		  // This comment contains a single quote: '
		  rgbLed.set_led_red();
		}
	  `

	  // Should parse successfully despite the single quote in the comment
	  expect(() => {
			CppParser.cppToByte(code)
	  }).not.toThrow()
	})
})
// Add these targeted tests to cpp-parser.test.ts

describe("Specific Edge Cases for Uncovered Lines", () => {
	test("should throw error for unsupported comparison operator", () => {
	// We need to mock identifyCommand to return a valid IF_STATEMENT with an invalid operator
		const originalIdentifyCommand = CppParser["identifyCommand"]

		try {
			// Mock identifyCommand to return an IF_STATEMENT with unsupported operator
			CppParser["identifyCommand"] = jest.fn().mockReturnValue({
				type: CommandType.IF_STATEMENT,
				matches: ["if (10 ? 5)", "10", "?", "5"] // ? is not a supported operator
			})

			// This should throw an "Unsupported operator" error
			expect(() => {
				CppParser.cppToByte("if (10 ? 5) { rgbLed.set_led_red(); }")
			}).toThrow(/Unsupported operator: \?/)
		} finally {
			// Restore original function
			CppParser["identifyCommand"] = originalIdentifyCommand
		}
	})

	test("should throw error for missing closing braces", () => {
		const originalValidateBalancedSyntax = CppParser["validateBalancedSyntax"]

		try {
			// Make validateBalancedSyntax always return true
			CppParser["validateBalancedSyntax"] = jest.fn().mockReturnValue(true)

			// This code is missing a closing brace
			expect(() => {
				CppParser.cppToByte(`
		if (10 > 5) {
			rgbLed.set_led_red();
		// Missing closing brace
		`)
			}).toThrow(/Syntax error: Missing .* closing brace/)
		} finally {
			// Restore original function
			CppParser["validateBalancedSyntax"] = originalValidateBalancedSyntax
		}
	})

	describe("Comment handling in syntax validation", () => {
	// Test the actual validateBalancedSyntax private method directly
		test("should properly handle line comments with brackets", () => {
			// Access the private method using type assertion
			const validateBalancedSyntax = (CppParser as any)["validateBalancedSyntax"]

			// Code with a line comment containing an unbalanced bracket
			const code = `
		if (x > 5) {
		// This comment has an unbalanced bracket }
		rgbLed.set_led_red();
		}
	`

			// The syntax should be valid despite the bracket in the comment
			expect(validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle block comments with brackets", () => {
			// Access the private method using type assertion
			const validateBalancedSyntax = (CppParser as any)["validateBalancedSyntax"]

			// Code with a block comment containing unbalanced brackets
			const code = `
		if (x > 5) {
		/* This block comment has multiple unbalanced brackets:
			{ [ } ] { } [ */
		rgbLed.set_led_red();
		}
	`

			// The syntax should be valid despite the brackets in the comment
			expect(validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle nested block comments", () => {
			// Access the private method using type assertion
			const validateBalancedSyntax = (CppParser as any)["validateBalancedSyntax"]

			// Code with block comments that *look* nested (not real nesting, but tricky)
			const code = `
		if (x > 5) {
		/* This comment has what looks like /* nested */ comments */
		rgbLed.set_led_red();
		}
	`

			// This is actually valid C++ because /* */ comments don't nest
			expect(validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle line continuation in code", () => {
			// Access the private method using type assertion
			const validateBalancedSyntax = (CppParser as any)["validateBalancedSyntax"]

			// Code with a line comment with a line continuation
			const code = `
		if (x > 5) { // comment
		rgbLed.set_led_red(); // Another comment \\
		continued comment
		}
	`

			// The syntax should be valid
			expect(validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle escaped characters in strings", () => {
			// Access the private method using type assertion
			const validateBalancedSyntax = (CppParser as any)["validateBalancedSyntax"]

			// Code with strings containing escaped quotes and brackets
			const code = `
		if (x > 5) {
		// String with escaped quotes: "This has \\"quotes\\" inside"
		// String with escaped brackets: "This has \\{brackets\\} inside"
		rgbLed.set_led_red();
		}
	`

			// The syntax should be valid
			expect(validateBalancedSyntax(code)).toBe(true)
		})
	})
})
