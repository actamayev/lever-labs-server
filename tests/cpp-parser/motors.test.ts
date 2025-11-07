import { CppParser } from "@/parser/cpp-parser"
import { BytecodeOpCode } from "../../src/types/bytecode-types"
import { describe, test, expect } from "@jest/globals"

describe("Motor Command Functionality", () => {
	describe("Basic Motor Commands", () => {
		test("should parse go forward command", () => {
			const code = "motors.drive(FORWARD, 50);"
			const bytecode = CppParser.cppToByte(code)

			// Check bytecode
			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE)
			expect(bytecode[1]).toBe(1)  // 1 for forward
			expect(bytecode[2]).toBe(50) // Throttle percentage
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused

			// Check END instruction
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should parse go backward command", () => {
			const code = "motors.drive(BACKWARD, 75);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE)
			expect(bytecode[1]).toBe(0)  // 0 for backward
			expect(bytecode[2]).toBe(75) // Throttle percentage
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should parse motors.stop command", () => {
			const code = "motors.stop();"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_STOP)
			expect(bytecode[1]).toBe(0)  // Unused
			expect(bytecode[2]).toBe(0)  // Unused
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should reject invalid throttle percentage for go forward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive(FORWARD, 101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for go forward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive(FORWARD, -5);")
			}).toThrow(/Invalid command/)
		})

		test("should reject invalid throttle percentage for go backward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive(BACKWARD, 101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for go backward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive(BACKWARD, -5);")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Turn Commands", () => {
		test("should parse turn command with clockwise direction", () => {
			const code = "motors.turn(CLOCKWISE, 90);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_TURN)
			expect(bytecode[1]).toBe(1)  // 1 for clockwise
			expect(bytecode[2]).toBe(90) // Degrees
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should parse turn command with counterclockwise direction", () => {
			const code = "motors.turn(COUNTERCLOCKWISE, 180);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_TURN)
			expect(bytecode[1]).toBe(0)   // 0 for counterclockwise
			expect(bytecode[2]).toBe(180) // Degrees
			expect(bytecode[3]).toBe(0)   // Unused
			expect(bytecode[4]).toBe(0)   // Unused
		})

		test("should reject invalid degree value for turn", () => {
			expect(() => {
				CppParser.cppToByte("motors.turn(CLOCKWISE, 0);")
			}).toThrow(/Invalid degrees/)

			expect(() => {
				CppParser.cppToByte("motors.turn(COUNTERCLOCKWISE, 1081);")
			}).toThrow(/Invalid degrees/)
		})
	})

	describe("Spin Commands", () => {
		test("should parse spin command with clockwise direction", () => {
			const code = "motors.spin(CLOCKWISE, 50);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_SPIN)
			expect(bytecode[1]).toBe(1)  // 1 for clockwise
			expect(bytecode[2]).toBe(50) // Speed percentage
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should parse spin command with counterclockwise direction", () => {
			const code = "motors.spin(COUNTERCLOCKWISE, 75);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_SPIN)
			expect(bytecode[1]).toBe(0)  // 0 for counterclockwise
			expect(bytecode[2]).toBe(75) // Speed percentage
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should reject invalid speed value for spin", () => {
			expect(() => {
				CppParser.cppToByte("motors.spin(CLOCKWISE, 101);")
			}).toThrow(/Invalid speed/)

			expect(() => {
				CppParser.cppToByte("motors.spin(COUNTERCLOCKWISE, -1);")
			}).toThrow(/Invalid command/)
		})

		test("should handle edge case speed values for spin", () => {
			// Test minimum valid speed
			const code1 = "motors.spin(CLOCKWISE, 0);"
			const bytecode1 = CppParser.cppToByte(code1)
			expect(bytecode1[0]).toBe(BytecodeOpCode.MOTOR_SPIN)
			expect(bytecode1[2]).toBe(0)

			// Test maximum valid speed
			const code2 = "motors.spin(COUNTERCLOCKWISE, 100);"
			const bytecode2 = CppParser.cppToByte(code2)
			expect(bytecode2[0]).toBe(BytecodeOpCode.MOTOR_SPIN)
			expect(bytecode2[2]).toBe(100)
		})
	})

	describe("Timed Motor Commands", () => {
		test("should parse motors.drive_time forward command", () => {
			const code = "motors.drive_time(FORWARD, 2.5, 60);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE_TIME)
			expect(bytecode[1]).toBe(1)   // 1 for forward
			expect(bytecode[2]).toBe(2.5) // Seconds
			expect(bytecode[3]).toBe(60)  // Throttle percentage
			expect(bytecode[4]).toBe(0)   // Unused
		})

		test("should parse motors.drive_time backward command", () => {
			const code = "motors.drive_time(BACKWARD, 1.75, 45);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE_TIME)
			expect(bytecode[1]).toBe(0)    // 0 for backward
			expect(bytecode[2]).toBe(1.75) // Seconds
			expect(bytecode[3]).toBe(45)   // Throttle percentage
			expect(bytecode[4]).toBe(0)    // Unused
		})

		test("should reject invalid time value for motors.drive_time forward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_time(FORWARD, 0, 50);")
			}).toThrow(/Invalid time value/)
		})

		test("should reject negative time value for motors.drive_time forward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_time(FORWARD, -1.5, 50);")
			}).toThrow(/Invalid command/)
		})

		test("should reject invalid throttle percentage for motors.drive_time backward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_time(BACKWARD, 2.0, 101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for motors.drive_time backward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_time(BACKWARD, 2.0, -10);")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Distance Motor Commands", () => {
		test("should parse motors.drive_distance forward command", () => {
			const code = "motors.drive_distance(FORWARD, 15.5, 70);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE_DISTANCE)
			expect(bytecode[1]).toBe(1)    // 1 for forward
			expect(bytecode[2]).toBe(15.5) // Distance in inches
			expect(bytecode[3]).toBe(70)   // Throttle percentage
			expect(bytecode[4]).toBe(0)    // Unused
		})

		test("should parse motors.drive_distance backward command", () => {
			const code = "motors.drive_distance(BACKWARD, 10.0, 55);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE_DISTANCE)
			expect(bytecode[1]).toBe(0)    // 0 for backward
			expect(bytecode[2]).toBe(10.0) // Distance in inches
			expect(bytecode[3]).toBe(55)   // Throttle percentage
			expect(bytecode[4]).toBe(0)    // Unused
		})

		test("should reject invalid distance value for motors.drive_distance forward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_distance(FORWARD, 0, 50);")
			}).toThrow(/Invalid distance value/)
		})

		test("should reject negative distance value for motors.drive_distance forward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_distance(FORWARD, -5.5, 50);")
			}).toThrow(/Invalid command/)
		})

		test("should reject invalid throttle percentage for motors.drive_distance backward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_distance(BACKWARD, 10.0, 101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for motors.drive_distance backward", () => {
			expect(() => {
				CppParser.cppToByte("motors.drive_distance(BACKWARD, 10.0, -10);")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Complex Motor Command Sequences", () => {
		test("should parse a complex motor control sequence", () => {
			const code = `
        motors.drive(FORWARD, 50);
        wait(1);
        motors.turn(CLOCKWISE, 90);
        wait(0.5);
        motors.drive(FORWARD, 75);
        wait(2);
        motors.turn(COUNTERCLOCKWISE, 45);
        wait(0.5);
        motors.drive(BACKWARD, 40);
        wait(1.5);
        motors.stop();
      `

			const bytecode = CppParser.cppToByte(code)

			// Check the first instruction is MOTOR_DRIVE
			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE)
			expect(bytecode[1]).toBe(1)  // 1 for forward
			expect(bytecode[2]).toBe(50) // throttle percentage

			// Check the third instruction is MOTOR_TURN with clockwise
			expect(bytecode[10]).toBe(BytecodeOpCode.MOTOR_TURN)
			expect(bytecode[11]).toBe(1) // clockwise
			expect(bytecode[12]).toBe(90) // 90 degrees

			// Check the last instruction before END is MOTOR_STOP
			const stopIndex = bytecode.length - 10
			expect(bytecode[stopIndex]).toBe(BytecodeOpCode.MOTOR_STOP)
		})

		test("should parse a sequence with spin commands", () => {
			const code = `
        motors.spin(CLOCKWISE, 30);
        wait(2);
        motors.spin(COUNTERCLOCKWISE, 50);
        wait(1.5);
        motors.drive(FORWARD, 60);
        wait(1);
        motors.stop();
      `

			const bytecode = CppParser.cppToByte(code)

			// Check the first instruction is MOTOR_SPIN
			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_SPIN)
			expect(bytecode[1]).toBe(1)  // 1 for clockwise
			expect(bytecode[2]).toBe(30) // speed percentage

			// Check the third instruction is MOTOR_SPIN counterclockwise
			expect(bytecode[10]).toBe(BytecodeOpCode.MOTOR_SPIN)
			expect(bytecode[11]).toBe(0)  // 0 for counterclockwise
			expect(bytecode[12]).toBe(50) // speed percentage
		})

		test("should parse a sequence with timed and distance commands", () => {
			const code = `
        motors.drive_time(FORWARD, 3.0, 60);
        wait(0.5);
        motors.turn(CLOCKWISE, 180);
        wait(0.5);
        motors.drive_distance(BACKWARD, 20.0, 80);
        wait(0.5);
        motors.stop();
      `

			const bytecode = CppParser.cppToByte(code)

			// Check the first instruction is MOTOR_DRIVE_TIME
			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_DRIVE_TIME)
			expect(bytecode[1]).toBe(1)   // 1 for forward
			expect(bytecode[2]).toBe(3.0) // seconds
			expect(bytecode[3]).toBe(60)  // throttle percentage

			// Check the fifth instruction is MOTOR_DRIVE_DISTANCE
			expect(bytecode[20]).toBe(BytecodeOpCode.MOTOR_DRIVE_DISTANCE)
			expect(bytecode[21]).toBe(0)    // 0 for backward
			expect(bytecode[22]).toBe(20.0) // distance
			expect(bytecode[23]).toBe(80)   // throttle percentage
		})
	})

	describe("Motor Commands in Control Structures", () => {
		test("should parse motor commands in if-else blocks", () => {
			const code = `
        if (imu.getPitch() > 10) {
          motors.drive(FORWARD, 70);
        } else {
          motors.drive(BACKWARD, 70);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find motor commands in the bytecode
			let forwardFound = false
			let backwardFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE) {
					if (bytecode[i + 1] === 1) { // Forward
						forwardFound = true
					} else if (bytecode[i + 1] === 0) { // Backward
						backwardFound = true
					}
				}
			}

			expect(forwardFound).toBe(true)
			expect(backwardFound).toBe(true)
		})

		test("should parse spin commands in if-else blocks", () => {
			const code = `
        if (imu.getRoll() > 15) {
          motors.spin(CLOCKWISE, 40);
        } else {
          motors.spin(COUNTERCLOCKWISE, 60);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find spin commands in the bytecode
			let clockwiseSpinFound = false
			let counterclockwiseSpinFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_SPIN) {
					if (bytecode[i + 1] === 1) { // Clockwise
						clockwiseSpinFound = true
					} else if (bytecode[i + 1] === 0) { // Counterclockwise
						counterclockwiseSpinFound = true
					}
				}
			}

			expect(clockwiseSpinFound).toBe(true)
			expect(counterclockwiseSpinFound).toBe(true)
		})

		test("should parse motor commands in for loops", () => {
			const code = `
        for (int i = 0; i < 3; i++) {
          motors.drive(FORWARD, 50);
          wait(0.5);
          motors.turn(CLOCKWISE, 120);
          wait(0.5);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find motor commands in the bytecode
			let forwardCount = 0
			let turnCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE) {
					forwardCount++
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_TURN) {
					turnCount++
				}
			}

			// Should find one of each even though it's in a loop
			expect(forwardCount).toBe(1)
			expect(turnCount).toBe(1)
		})

		test("should parse spin commands in for loops", () => {
			const code = `
        for (int i = 0; i < 5; i++) {
          motors.spin(CLOCKWISE, 25);
          wait(1);
          motors.spin(COUNTERCLOCKWISE, 35);
          wait(1);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find spin commands in the bytecode
			let clockwiseSpinCount = 0
			let counterclockwiseSpinCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_SPIN) {
					if (bytecode[i + 1] === 1) { // Clockwise
						clockwiseSpinCount++
					} else if (bytecode[i + 1] === 0) { // Counterclockwise
						counterclockwiseSpinCount++
					}
				}
			}

			// Should find one of each even though it's in a loop
			expect(clockwiseSpinCount).toBe(1)
			expect(counterclockwiseSpinCount).toBe(1)
		})

		test("should parse motor commands in while loops", () => {
			const code = `
        while(true) {
          motors.drive_distance(FORWARD, 10.0, 60);
          wait(1);
          motors.turn(COUNTERCLOCKWISE, 180);
          wait(1);
          motors.drive_distance(BACKWARD, 10.0, 60);
          wait(1);
          motors.turn(CLOCKWISE, 180);
          wait(1);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find motor commands in the bytecode
			let forwardFound = false
			let backwardFound = false
			let clockwiseTurnFound = false
			let counterclockwiseTurnFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_DRIVE_DISTANCE) {
					if (bytecode[i + 1] === 1) { // Forward
						forwardFound = true
					} else if (bytecode[i + 1] === 0) { // Backward
						backwardFound = true
					}
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_TURN) {
					if (bytecode[i + 1] === 1) { // Clockwise
						clockwiseTurnFound = true
					} else if (bytecode[i + 1] === 0) { // Counterclockwise
						counterclockwiseTurnFound = true
					}
				}
			}

			expect(forwardFound).toBe(true)
			expect(backwardFound).toBe(true)
			expect(clockwiseTurnFound).toBe(true)
			expect(counterclockwiseTurnFound).toBe(true)
		})
	})
})
