
import { CppParser } from "@/parser/cpp-parser"
import { CppParserHelper } from "@/parser/cpp-parser-helper"
import { BytecodeOpCode } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

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
		const result = CppParserHelper.validateBalancedSyntax("if (x > 5) { all_leds.set_color(RED);")
		expect(result).not.toBe(true)
		expect(result).toContain("Unclosed")
	})

	test("should detect unexpected closing brackets", () => {
		const result = CppParserHelper.validateBalancedSyntax("if (x > 5) } all_leds.set_color(RED);")
		expect(result).not.toBe(true)
		expect(result).toContain("Unexpected closing")
	})

	test("should detect mismatched brackets", () => {
		const result = CppParserHelper.validateBalancedSyntax("if (x > 5) { all_leds.set_color(RED); ]")
		expect(result).not.toBe(true)
		expect(result).toContain("Expected")
		expect(result).toContain("but found")
	})

	test("should handle strings with escaped characters", () => {
	// Create a valid code pattern that contains a comment with escaped characters
		const code = `
	// This comment has escaped quotes \\"like this\\"
	if (10 > 5) {
	all_leds.set_color(RED);
	/* This block comment also has escaped chars: \\", \\', \\\\ */
	wait(0.1);
	}
`

		// This shouldn't throw because the syntax is balanced despite the escapes
		const result = CppParserHelper.validateBalancedSyntax(code)
		expect(result).toBe(true)
	})

	test("should handle comments with bracket characters", () => {
		const code = `
	// This comment has {brackets} and [square brackets]
	if (10 > 5) {
	all_leds.set_color(RED);
	/* This block comment has {unbalanced brackets */
	wait(0.1);
	}
`

		// Comments with bracket characters shouldn't affect syntax validation
		const result = CppParserHelper.validateBalancedSyntax(code)
		expect(result).toBe(true)
	})
})

describe("Code sanitization", () => {
	test("should properly protect for loop semicolons", () => {
		const code = `
	for (int i = 0; i < 10; i++) {
	for (int j = 0; j < 5; j++) {
		all_leds.set_color(RED);
		wait(0.1);
	}
	}
`

		const sanitized = CppParserHelper.sanitizeUserCode(code)

		// Check that for loop semicolons are protected
		expect(sanitized).toContain("for (int i = 0###SEMICOLON### i < 10###SEMICOLON### i++)")
		expect(sanitized).toContain("for (int j = 0###SEMICOLON### j < 5###SEMICOLON### j++)")

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
	all_leds.set_color(RED);
	}else{
	all_leds.set_color(BLUE);
	}
`

		const sanitized = CppParserHelper.sanitizeUserCode(code)

		// Check that else is properly separated
		expect(sanitized).toContain("} ; else")

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
	all_leds.set_color(RED);
	/* Block comment
		spanning multiple lines */
	wait(0.1);
`

		const sanitized = CppParserHelper.sanitizeUserCode(code)

		// Check that comments are removed
		expect(sanitized).not.toContain("Line comment")
		expect(sanitized).not.toContain("Block comment")

		const bytecode = CppParser.cppToByte(code)

		// Verify the bytecode has instructions for set_led_red and wait, but not for the comments
		expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
		expect(bytecode[5]).toBe(BytecodeOpCode.WAIT)
		expect(bytecode[10]).toBe(BytecodeOpCode.END)
	})

	test("should properly escape single quotes", () => {
		const code = `
	if (10 > 5) {
	// This comment contains a single quote: '
	all_leds.set_color(RED);
	}
`

		const sanitized = CppParserHelper.sanitizeUserCode(code)

		// Check that single quotes are escaped
		expect(sanitized).not.toContain("'")
		expect(sanitized).not.toContain("'\\''")

		// Should parse successfully despite the single quote in the comment
		expect(() => {
			CppParser.cppToByte(code)
		}).not.toThrow()
	})
})

describe("Specific Edge Cases for Uncovered Lines", () => {
	test("should throw error for invalid command with unsupported comparison operator", () => {
		expect(() => {
			CppParser.cppToByte("if (10 ? 5) { all_leds.set_color(RED); }")
		}).toThrow(/Invalid command/)
	})

	test("should throw error for missing closing braces", () => {
		const originalValidateBalancedSyntax = CppParserHelper.validateBalancedSyntax

		try {
		// Make validateBalancedSyntax always return true
			CppParserHelper.validateBalancedSyntax = jest.fn().mockReturnValue(true)

			// This code is missing a closing brace
			expect(() => {
				CppParser.cppToByte(`
		if (10 > 5) {
		all_leds.set_color(RED);
		// Missing closing brace
	`)
			}).toThrow(/Syntax error: Missing .* closing brace/)
		} finally {
		// Restore original function
			CppParserHelper.validateBalancedSyntax = originalValidateBalancedSyntax
		}
	})

	describe("Comment handling in syntax validation", () => {
		test("should properly handle line comments with brackets", () => {
		// Code with a line comment containing an unbalanced bracket
			const code = `
	if (x > 5) {
	// This comment has an unbalanced bracket }
	all_leds.set_color(RED);
	}
	`

			// The syntax should be valid despite the bracket in the comment
			expect(CppParserHelper.validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle block comments with brackets", () => {
		// Code with a block comment containing unbalanced brackets
			const code = `
	if (x > 5) {
	/* This block comment has multiple unbalanced brackets:
		{ [ } ] { } [ */
	all_leds.set_color(RED);
	}
	`

			// The syntax should be valid despite the brackets in the comment
			expect(CppParserHelper.validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle nested block comments", () => {
		// Code with block comments that *look* nested (not real nesting, but tricky)
			const code = `
	if (x > 5) {
	/* This comment has what looks like /* nested */ comments */
	all_leds.set_color(RED);
	}
	`

			// This is actually valid C++ because /* */ comments don't nest
			expect(CppParserHelper.validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle line continuation in code", () => {
		// Code with a line comment with a line continuation
			const code = `
	if (x > 5) { // comment
	all_leds.set_color(RED); // Another comment \\
	continued comment
	}
	`

			// The syntax should be valid
			expect(CppParserHelper.validateBalancedSyntax(code)).toBe(true)
		})

		test("should properly handle escaped characters in strings", () => {
		// Code with strings containing escaped quotes and brackets
			const code = `
	if (x > 5) {
	// String with escaped quotes: "This has \\"quotes\\" inside"
	// String with escaped brackets: "This has \\{brackets\\} inside"
	all_leds.set_color(RED);
	}
	`

			// The syntax should be valid
			expect(CppParserHelper.validateBalancedSyntax(code)).toBe(true)
		})
	})
})
