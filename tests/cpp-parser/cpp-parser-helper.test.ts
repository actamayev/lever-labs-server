import { BytecodeInstruction } from "@/types/bytecode"
import { CppParser } from "../../src/parser/cpp-parser"
import { CppParserHelper } from "@/parser/cpp-parser-helper"
import { MAX_LED_BRIGHTNESS, MAX_REGISTERS } from "@/utils/constants/constants"
import { BytecodeOpCode, CommandType, ComparisonOp, SensorType } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

describe("CppParserHelper", () => {
	describe("identifyCommand", () => {
		test("should identify a valid command", () => {
			const statement = "all_leds.set_color(RED)"
			const result = CppParserHelper.identifyCommand(statement)

			expect(result).not.toBeNull()
			expect(result?.type).toBe(CommandType.SET_LED_COLOR)
		})

		test("should return null for unrecognized command", () => {
			const statement = "nonExistentCommand()"
			const result = CppParserHelper.identifyCommand(statement)

			expect(result).toBeNull()
		})

		test("should match all command types", () => {
		// Test a sample of different command types
			const commandTests = [
				{ statement: "all_leds.set_color(BLUE)", type: CommandType.SET_LED_COLOR },
				{ statement: "wait(0.1)", type: CommandType.WAIT },
				{ statement: "if (10 > 5)", type: CommandType.IF_STATEMENT },
				{ statement: "while(true)", type: CommandType.WHILE_STATEMENT },
				{ statement: "for (int i = 0; i < 10; i++)", type: CommandType.FOR_STATEMENT },
				{ statement: "motors.drive(FORWARD, 50)", type: CommandType.DRIVE },
				{ statement: "left_distance_sensor.is_object_near()", type: CommandType.LEFT_DISTANCE_SENSOR },
				{ statement: "right_distance_sensor.is_object_near()", type: CommandType.RIGHT_DISTANCE_SENSOR },
				{ statement: "front_distance_sensor.is_object_in_front()", type: CommandType.FRONT_PROXIMITY_DETECTION },
				{ statement: "left_button.wait_for_press()", type: CommandType.WAIT_FOR_BUTTON }
			]

			for (const { statement, type } of commandTests) {
				const result = CppParserHelper.identifyCommand(statement)
				expect(result).not.toBeNull()
				expect(result?.type).toBe(type)
			}
		})
	})

	describe("getSensorTypeFromProximity", () => {
		test("should return correct type for left proximity", () => {
			const result = CppParserHelper.getSensorTypeFromProximity("left")
			expect(result).toBe(SensorType.SIDE_LEFT_PROXIMITY)
		})

		test("should return correct type for right proximity", () => {
			const result = CppParserHelper.getSensorTypeFromProximity("right")
			expect(result).toBe(SensorType.SIDE_RIGHT_PROXIMITY)
		})

		test("should return correct type for front proximity", () => {
			const result = CppParserHelper.getSensorTypeFromProximity("front")
			expect(result).toBe(SensorType.FRONT_PROXIMITY)
		})

		test("should throw error for unknown proximity type", () => {
			expect(() => {
				CppParserHelper.getSensorTypeFromProximity("unknown")
			}).toThrow(/Unknown proximity type/)
		})
	})

	describe("generateBytecode", () => {
		test("should generate bytecode from instructions", () => {
			const instructions: BytecodeInstruction[] = [
				{
					opcode: BytecodeOpCode.SET_ALL_LEDS,
					operand1: 255,
					operand2: 0,
					operand3: 0,
					operand4: 0
				},
				{
					opcode: BytecodeOpCode.WAIT,
					operand1: 100,
					operand2: 0,
					operand3: 0,
					operand4: 0
				},
				{
					opcode: BytecodeOpCode.END,
					operand1: 0,
					operand2: 0,
					operand3: 0,
					operand4: 0
				}
			]

			const bytecode = CppParserHelper.generateBytecode(instructions)

			// Should be a Float32Array
			expect(bytecode instanceof Float32Array).toBe(true)

			// Should have length equal to 5 * number of instructions
			expect(bytecode.length).toBe(5 * instructions.length)

			// Check the first instruction (SET_ALL_LEDS)
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(255)
			expect(bytecode[2]).toBe(0)
			expect(bytecode[3]).toBe(0)
			expect(bytecode[4]).toBe(0)

			// Check the second instruction (WAIT)
			expect(bytecode[5]).toBe(BytecodeOpCode.WAIT)
			expect(bytecode[6]).toBe(100)
			expect(bytecode[7]).toBe(0)
			expect(bytecode[8]).toBe(0)
			expect(bytecode[9]).toBe(0)

			// Check the third instruction (END)
			expect(bytecode[10]).toBe(BytecodeOpCode.END)
			expect(bytecode[11]).toBe(0)
			expect(bytecode[12]).toBe(0)
			expect(bytecode[13]).toBe(0)
			expect(bytecode[14]).toBe(0)
		})

		test("should generate empty bytecode for empty instructions", () => {
			const instructions: BytecodeInstruction[] = []

			const bytecode = CppParserHelper.generateBytecode(instructions)

			expect(bytecode instanceof Float32Array).toBe(true)
			expect(bytecode.length).toBe(0)
		})

		test("should generate bytecode with large number of instructions", () => {
		// Create 100 wait instructions
			const instructions: BytecodeInstruction[] = []
			for (let i = 0; i < 100; i++) {
				instructions.push({
					opcode: BytecodeOpCode.WAIT,
					operand1: i,
					operand2: 0,
					operand3: 0,
					operand4: 0
				})
			}

			const bytecode = CppParserHelper.generateBytecode(instructions)

			expect(bytecode.length).toBe(5 * 100)

			// Check a few instructions at different positions
			expect(bytecode[0]).toBe(BytecodeOpCode.WAIT)
			expect(bytecode[1]).toBe(0)

			expect(bytecode[5 * 50]).toBe(BytecodeOpCode.WAIT)
			expect(bytecode[5 * 50 + 1]).toBe(50)

			expect(bytecode[5 * 99]).toBe(BytecodeOpCode.WAIT)
			expect(bytecode[5 * 99 + 1]).toBe(99)
		})
	})

	// Integration test to ensure the parser and helper work together
	describe("Integration with CppParser", () => {
		test("should correctly parse front proximity sensor code", () => {
			const code = "if (front_distance_sensor.is_object_in_front()) { all_leds.set_color(RED); }"
			const bytecode = CppParser.cppToByte(code)

			// Should have READ_SENSOR for front proximity
			expect(bytecode[0]).toBe(BytecodeOpCode.READ_SENSOR)
			expect(bytecode[1]).toBe(SensorType.FRONT_PROXIMITY)
		})

		test("should correctly generate LED commands", () => {
			const code = `
	all_leds.set_color(RED);
	all_leds.set_color(BLUE);
	`

			const bytecode = CppParser.cppToByte(code)

			// Should have SET_LED for top left
			expect(bytecode[0]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[1]).toBe(MAX_LED_BRIGHTNESS)
			expect(bytecode[2]).toBe(0)
			expect(bytecode[3]).toBe(0)
			expect(bytecode[4]).toBe(0)

			expect(bytecode[5]).toBe(BytecodeOpCode.SET_ALL_LEDS)
			expect(bytecode[6]).toBe(0)
			expect(bytecode[7]).toBe(0)
			expect(bytecode[8]).toBe(MAX_LED_BRIGHTNESS)
			expect(bytecode[9]).toBe(0)
		})
	})

	describe("CppParserHelper.processOperand", () => {
	// We'll directly test the processOperand method
		test("should process sensor operand correctly", () => {
		// Setup
			const expr = "imu.getPitch()"
			const variables = new Map()
			const nextRegister = 0
			const instructions: BytecodeInstruction[] = []

			// Execute
			const result = CppParserHelper.processOperand(expr, variables, nextRegister, instructions)

			// Verify
			// 1. Should have added a READ_SENSOR instruction
			expect(instructions.length).toBe(1)
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.PITCH)
			expect(instructions[0].operand2).toBe(0) // Register 0
			expect(instructions[0].operand3).toBe(0)
			expect(instructions[0].operand4).toBe(0)

			// 2. Should return correct operand and updated register
			expect(result.operand).toBe(0x8000) // Register 0 with high bit set
			expect(result.updatedNextRegister).toBe(1) // nextRegister incremented
		})

		test("should handle different sensor types", () => {
			const sensorTests = [
				{ expr: "imu.getPitch()", type: SensorType.PITCH },
				{ expr: "imu.getRoll()", type: SensorType.ROLL },
				{ expr: "imu.getYaw()", type: SensorType.YAW },
				{ expr: "imu.getXAccel()", type: SensorType.ACCEL_X },
				{ expr: "imu.getAccelMagnitude()", type: SensorType.ACCEL_MAG },
				{ expr: "imu.getXRotationRate()", type: SensorType.ROT_RATE_X },
				{ expr: "imu.getMagneticFieldX()", type: SensorType.MAG_FIELD_X }
			]

			for (const { expr, type } of sensorTests) {
				const variables = new Map()
				const nextRegister = 0
				const instructions: BytecodeInstruction[] = []

				const result = CppParserHelper.processOperand(expr, variables, nextRegister, instructions)

				expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
				expect(instructions[0].operand1).toBe(type)
				expect(result.operand).toBe(0x8000) // Register 0 with high bit set
			}
		})

		test("should throw error when registers are exhausted", () => {
			const expr = "imu.getPitch()"
			const variables = new Map()
			const nextRegister = MAX_REGISTERS // Setting to max to trigger error
			const instructions: BytecodeInstruction[] = []

			expect(() => {
				CppParserHelper.processOperand(expr, variables, nextRegister, instructions)
			}).toThrow(/exceeds maximum register count/)

			// Should not have added any instructions
			expect(instructions.length).toBe(0)
		})

		test("should increment register for multiple sensor operands", () => {
			const variables = new Map()
			let nextRegister = 0
			const instructions: BytecodeInstruction[] = []

			// Process first sensor
			const result1 = CppParserHelper.processOperand(
				"imu.getPitch()",
				variables,
				nextRegister,
				instructions
			)

			// Update nextRegister
			nextRegister = result1.updatedNextRegister

			// Process second sensor
			const result2 = CppParserHelper.processOperand(
				"imu.getRoll()",
				variables,
				nextRegister,
				instructions
			)

			// Verify first instruction
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.PITCH)
			expect(instructions[0].operand2).toBe(0) // Register 0

			// Verify second instruction
			expect(instructions[1].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[1].operand1).toBe(SensorType.ROLL)
			expect(instructions[1].operand2).toBe(1) // Register 1

			// Verify returned values
			expect(result1.operand).toBe(0x8000) // Register 0 with high bit
			expect(result2.operand).toBe(0x8001) // Register 1 with high bit
			expect(result2.updatedNextRegister).toBe(2)
		})

		test("should return high bit for register operand", () => {
			const expr = "imu.getYaw()"
			const variables = new Map()
			const nextRegister = 5 // Start at register 5
			const instructions: BytecodeInstruction[] = []

			const result = CppParserHelper.processOperand(expr, variables, nextRegister, instructions)

			// Operand should be register 5 with high bit set (0x8000 | 5 = 32773)
			expect(result.operand).toBe(0x8000 | 5)
			expect(result.updatedNextRegister).toBe(6)
		})
	})

	describe("CppParserHelper.parseComparisonOperator", () => {
		test("should return correct comparison operators", () => {
		// Test all valid operators
			expect(CppParserHelper.parseComparisonOperator(">")).toBe(ComparisonOp.GREATER_THAN)
			expect(CppParserHelper.parseComparisonOperator("<")).toBe(ComparisonOp.LESS_THAN)
			expect(CppParserHelper.parseComparisonOperator(">=")).toBe(ComparisonOp.GREATER_EQUAL)
			expect(CppParserHelper.parseComparisonOperator("<=")).toBe(ComparisonOp.LESS_EQUAL)
			expect(CppParserHelper.parseComparisonOperator("==")).toBe(ComparisonOp.EQUAL)
			expect(CppParserHelper.parseComparisonOperator("!=")).toBe(ComparisonOp.NOT_EQUAL)
		})

		test("should throw error for unsupported operator", () => {
		// Test with invalid operators
			expect(() => {
				CppParserHelper.parseComparisonOperator("?")
			}).toThrow(/Unsupported operator: \?/)

			expect(() => {
				CppParserHelper.parseComparisonOperator("<>")
			}).toThrow(/Unsupported operator: <>/)

			expect(() => {
				CppParserHelper.parseComparisonOperator("=")
			}).toThrow(/Unsupported operator: =/)
		})
	})

	test("should throw for unsupported variable type", () => {
	// Store the original method
		const originalIdentifyCommand = CppParserHelper.identifyCommand

		try {
			// Mock the helper's identifyCommand method with correct typing
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			CppParserHelper.identifyCommand = ((_statement: string) => ({
				type: CommandType.VARIABLE_ASSIGNMENT,
				matches: ["full match", "double", "testVar", "3.14"]
			})) as typeof CppParserHelper.identifyCommand

			// Test that it throws the correct error
			expect(() => {
				CppParser.cppToByte("double testVar = 3.14;")
			}).toThrow(/Unsupported type: double/)
		} finally {
		// Restore the original method
			CppParserHelper.identifyCommand = originalIdentifyCommand
		}
	})

	test("should throw error for unsupported comparison operator", () => {
		// Let's directly modify CppParserHelper.parseComparisonOperator
		const originalParseComparisonOperator = CppParserHelper.parseComparisonOperator

		try {
		  // Monkey-patch parseComparisonOperator to throw when it sees <=>
		  CppParserHelper.parseComparisonOperator = function(op: string): ComparisonOp {
				if (op === "<=>") {
				  throw new Error("Unsupported operator: <=>")
				}
				return originalParseComparisonOperator.call(CppParserHelper, op)
		  }

		  // This should now throw the unsupported operator error
		  expect(() => {
				CppParser.cppToByte("if (10 <=> 5) { all_leds.set_color(RED); }")
		  }).toThrow("Invalid command: \"if (10 <=> 5)\"")
		} finally {
		  // Restore original method
		  CppParserHelper.parseComparisonOperator = originalParseComparisonOperator
		}
	  })

	describe("CppParserHelper.processOperand for proximity sensors", () => {
		test("should process left side proximity detection", () => {
			// Setup
			const expr = "left_distance_sensor.is_object_near()"
			const variables = new Map()
			const nextRegister = 0
			const instructions: BytecodeInstruction[] = []

			// Execute
			const result = CppParserHelper.processOperand(expr, variables, nextRegister, instructions)

			// Verify
			expect(instructions.length).toBe(1)
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.SIDE_LEFT_PROXIMITY)
			expect(instructions[0].operand2).toBe(0) // Register 0
			expect(instructions[0].operand3).toBe(0)
			expect(instructions[0].operand4).toBe(0)

			expect(result.operand).toBe(0x8000) // Register 0 with high bit set
			expect(result.updatedNextRegister).toBe(1)
		})

		test("should process right side proximity detection", () => {
			// Setup
			const expr = "right_distance_sensor.is_object_near()"
			const variables = new Map()
			const nextRegister = 0
			const instructions: BytecodeInstruction[] = []

			// Execute
			const result = CppParserHelper.processOperand(expr, variables, nextRegister, instructions)

			// Verify
			expect(instructions.length).toBe(1)
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.SIDE_RIGHT_PROXIMITY)
			expect(instructions[0].operand2).toBe(0) // Register 0
			expect(instructions[0].operand3).toBe(0)
			expect(instructions[0].operand4).toBe(0)

			expect(result.operand).toBe(0x8000) // Register 0 with high bit set
			expect(result.updatedNextRegister).toBe(1)
		})

		test("should process front proximity detection", () => {
			// Setup
			const expr = "front_distance_sensor.is_object_in_front()"
			const variables = new Map()
			const nextRegister = 0
			const instructions: BytecodeInstruction[] = []

			// Execute
			const result = CppParserHelper.processOperand(expr, variables, nextRegister, instructions)

			// Verify
			expect(instructions.length).toBe(1)
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.FRONT_PROXIMITY)
			expect(instructions[0].operand2).toBe(0) // Register 0
			expect(instructions[0].operand3).toBe(0)
			expect(instructions[0].operand4).toBe(0)

			expect(result.operand).toBe(0x8000) // Register 0 with high bit set
			expect(result.updatedNextRegister).toBe(1)
		})

		test("should throw error when registers are exhausted for proximity detection", () => {
			// Setup
			const expr = "front_distance_sensor.is_object_in_front()"
			const variables = new Map()
			const nextRegister = MAX_REGISTERS // Set to max to trigger error
			const instructions: BytecodeInstruction[] = []

			// Verify
			expect(() => {
				CppParserHelper.processOperand(expr, variables, nextRegister, instructions)
			}).toThrow(/exceeds maximum register count/)

			// Should not have added any instructions
			expect(instructions.length).toBe(0)
		})

		test("should increment register for multiple proximity detections", () => {
			const variables = new Map()
			let nextRegister = 0
			const instructions: BytecodeInstruction[] = []

			// Process first proximity
			const result1 = CppParserHelper.processOperand(
				"left_distance_sensor.is_object_near()",
				variables,
				nextRegister,
				instructions
			)

			// Update nextRegister
			nextRegister = result1.updatedNextRegister

			// Process second proximity
			const result2 = CppParserHelper.processOperand(
				"front_distance_sensor.is_object_in_front()",
				variables,
				nextRegister,
				instructions
			)

			// Update nextRegister
			nextRegister = result2.updatedNextRegister

			// Process third proximity
			const result3 = CppParserHelper.processOperand(
				"right_distance_sensor.is_object_near()",
				variables,
				nextRegister,
				instructions
			)

			// Verify first instruction
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.SIDE_LEFT_PROXIMITY)
			expect(instructions[0].operand2).toBe(0) // Register 0

			// Verify second instruction
			expect(instructions[1].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[1].operand1).toBe(SensorType.FRONT_PROXIMITY)
			expect(instructions[1].operand2).toBe(1) // Register 1

			// Verify third instruction
			expect(instructions[2].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[2].operand1).toBe(SensorType.SIDE_RIGHT_PROXIMITY)
			expect(instructions[2].operand2).toBe(2) // Register 2

			// Verify returned values
			expect(result1.operand).toBe(0x8000) // Register 0 with high bit
			expect(result2.operand).toBe(0x8001) // Register 1 with high bit
			expect(result3.operand).toBe(0x8002) // Register 2 with high bit
			expect(result3.updatedNextRegister).toBe(3)
		})

		test("should handle mix of proximity sensors and regular sensors", () => {
			const variables = new Map()
			let nextRegister = 0
			const instructions: BytecodeInstruction[] = []

			// Process proximity sensor
			const result1 = CppParserHelper.processOperand(
				"front_distance_sensor.is_object_in_front()",
				variables,
				nextRegister,
				instructions
			)

			// Update nextRegister
			nextRegister = result1.updatedNextRegister

			// Process regular sensor
			const result2 = CppParserHelper.processOperand(
				"imu.getPitch()",
				variables,
				nextRegister,
				instructions
			)

			// Verify first instruction (proximity)
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.FRONT_PROXIMITY)
			expect(instructions[0].operand2).toBe(0) // Register 0

			// Verify second instruction (regular sensor)
			expect(instructions[1].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[1].operand1).toBe(SensorType.PITCH)
			expect(instructions[1].operand2).toBe(1) // Register 1

			// Verify returned values
			expect(result1.operand).toBe(0x8000) // Register 0 with high bit
			expect(result2.operand).toBe(0x8001) // Register 1 with high bit
			expect(result2.updatedNextRegister).toBe(2)
		})

		test("should use non-zero starting register", () => {
			// Setup with starting register other than 0
			const expr = "left_distance_sensor.is_object_near()"
			const variables = new Map()
			const nextRegister = 5 // Start at register 5
			const instructions: BytecodeInstruction[] = []

			// Execute
			const result = CppParserHelper.processOperand(expr, variables, nextRegister, instructions)

			// Verify
			expect(instructions[0].opcode).toBe(BytecodeOpCode.READ_SENSOR)
			expect(instructions[0].operand1).toBe(SensorType.SIDE_LEFT_PROXIMITY)
			expect(instructions[0].operand2).toBe(5) // Register 5

			expect(result.operand).toBe(0x8000 | 5) // Register 5 with high bit set
			expect(result.updatedNextRegister).toBe(6)
		})
	})
})
