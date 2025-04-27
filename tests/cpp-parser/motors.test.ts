/* eslint-disable max-lines-per-function */
import CppParser from "../../src/classes/cpp-parser"
import { BytecodeOpCode } from "../../src/types/bytecode-types"

describe("Motor Command Functionality", () => {
	describe("Basic Motor Commands", () => {
		test("should parse goForward command", () => {
			const code = "goForward(50);"
			const bytecode = CppParser.cppToByte(code)

			// Check bytecode
			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_FORWARD)
			expect(bytecode[1]).toBe(50) // Throttle percentage
			expect(bytecode[2]).toBe(0)  // Unused
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused

			// Check END instruction
			expect(bytecode[5]).toBe(BytecodeOpCode.END)
		})

		test("should parse goBackward command", () => {
			const code = "goBackward(75);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_BACKWARD)
			expect(bytecode[1]).toBe(75) // Throttle percentage
			expect(bytecode[2]).toBe(0)  // Unused
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should parse stopMotors command", () => {
			const code = "stopMotors();"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_STOP)
			expect(bytecode[1]).toBe(0)  // Unused
			expect(bytecode[2]).toBe(0)  // Unused
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should reject invalid throttle percentage for goForward", () => {
			expect(() => {
				CppParser.cppToByte("goForward(101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for goForward", () => {
			expect(() => {
				CppParser.cppToByte("goForward(-5);")
			}).toThrow(/Invalid command/)
		})

		test("should reject invalid throttle percentage for goBackward", () => {
			expect(() => {
				CppParser.cppToByte("goBackward(101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for goBackward", () => {
			expect(() => {
				CppParser.cppToByte("goBackward(-5);")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Turn Commands", () => {
		test("should parse turn command with clockwise direction", () => {
			const code = "turn(CLOCKWISE, 90);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_TURN)
			expect(bytecode[1]).toBe(1)  // 1 for clockwise
			expect(bytecode[2]).toBe(90) // Degrees
			expect(bytecode[3]).toBe(0)  // Unused
			expect(bytecode[4]).toBe(0)  // Unused
		})

		test("should parse turn command with counterclockwise direction", () => {
			const code = "turn(COUNTERCLOCKWISE, 180);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_TURN)
			expect(bytecode[1]).toBe(0)   // 0 for counterclockwise
			expect(bytecode[2]).toBe(180) // Degrees
			expect(bytecode[3]).toBe(0)   // Unused
			expect(bytecode[4]).toBe(0)   // Unused
		})

		test("should reject invalid degree value for turn", () => {
			expect(() => {
				CppParser.cppToByte("turn(CLOCKWISE, 0);")
			}).toThrow(/Invalid degrees/)

			expect(() => {
				CppParser.cppToByte("turn(COUNTERCLOCKWISE, 361);")
			}).toThrow(/Invalid degrees/)
		})
	})

	describe("Timed Motor Commands", () => {
		test("should parse goForwardTime command", () => {
			const code = "goForwardTime(2.5, 60);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_FORWARD_TIME)
			expect(bytecode[1]).toBe(2.5) // Seconds
			expect(bytecode[2]).toBe(60)  // Throttle percentage
			expect(bytecode[3]).toBe(0)   // Unused
			expect(bytecode[4]).toBe(0)   // Unused
		})

		test("should parse goBackwardTime command", () => {
			const code = "goBackwardTime(1.75, 45);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_BACKWARD_TIME)
			expect(bytecode[1]).toBe(1.75) // Seconds
			expect(bytecode[2]).toBe(45)   // Throttle percentage
			expect(bytecode[3]).toBe(0)    // Unused
			expect(bytecode[4]).toBe(0)    // Unused
		})

		test("should reject invalid time value for goForwardTime", () => {
			expect(() => {
				CppParser.cppToByte("goForwardTime(0, 50);")
			}).toThrow(/Invalid time value/)
		})

		test("should reject negative time value for goForwardTime", () => {
			expect(() => {
				CppParser.cppToByte("goForwardTime(-1.5, 50);")
			}).toThrow(/Invalid command/)
		})

		test("should reject invalid throttle percentage for goBackwardTime", () => {
			expect(() => {
				CppParser.cppToByte("goBackwardTime(2.0, 101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for goBackwardTime", () => {
			expect(() => {
				CppParser.cppToByte("goBackwardTime(2.0, -10);")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Distance Motor Commands", () => {
		test("should parse goForwardDistance command", () => {
			const code = "goForwardDistance(15.5, 70);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_FORWARD_DISTANCE)
			expect(bytecode[1]).toBe(15.5) // Distance in cm
			expect(bytecode[2]).toBe(70)   // Throttle percentage
			expect(bytecode[3]).toBe(0)    // Unused
			expect(bytecode[4]).toBe(0)    // Unused
		})

		test("should parse goBackwardDistance command", () => {
			const code = "goBackwardDistance(10.0, 55);"
			const bytecode = CppParser.cppToByte(code)

			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_BACKWARD_DISTANCE)
			expect(bytecode[1]).toBe(10.0) // Distance in cm
			expect(bytecode[2]).toBe(55)   // Throttle percentage
			expect(bytecode[3]).toBe(0)    // Unused
			expect(bytecode[4]).toBe(0)    // Unused
		})

		test("should reject invalid distance value for goForwardDistance", () => {
			expect(() => {
				CppParser.cppToByte("goForwardDistance(0, 50);")
			}).toThrow(/Invalid distance value/)
		})

		test("should reject negative distance value for goForwardDistance", () => {
			expect(() => {
				CppParser.cppToByte("goForwardDistance(-5.5, 50);")
			}).toThrow(/Invalid command/)
		})

		test("should reject invalid throttle percentage for goBackwardDistance", () => {
			expect(() => {
				CppParser.cppToByte("goBackwardDistance(10.0, 101);")
			}).toThrow(/Invalid throttle percentage/)
		})

		test("should reject negative throttle value for goBackwardDistance", () => {
			expect(() => {
				CppParser.cppToByte("goBackwardDistance(10.0, -10);")
			}).toThrow(/Invalid command/)
		})
	})

	describe("Complex Motor Command Sequences", () => {
		test("should parse a complex motor control sequence", () => {
			const code = `
        goForward(50);
        delay(1000);
        turn(CLOCKWISE, 90);
        delay(500);
        goForward(75);
        delay(2000);
        turn(COUNTERCLOCKWISE, 45);
        delay(500);
        goBackward(40);
        delay(1500);
        stopMotors();
      `

			const bytecode = CppParser.cppToByte(code)

			// Check the first instruction is MOTOR_FORWARD
			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_FORWARD)
			expect(bytecode[1]).toBe(50)

			// Check the third instruction is MOTOR_TURN with clockwise
			expect(bytecode[10]).toBe(BytecodeOpCode.MOTOR_TURN)
			expect(bytecode[11]).toBe(1) // clockwise
			expect(bytecode[12]).toBe(90) // 90 degrees

			// Check the last instruction before END is MOTOR_STOP
			const stopIndex = bytecode.length - 10
			expect(bytecode[stopIndex]).toBe(BytecodeOpCode.MOTOR_STOP)
		})

		test("should parse a sequence with timed and distance commands", () => {
			const code = `
        goForwardTime(3.0, 60);
        delay(500);
        turn(CLOCKWISE, 180);
        delay(500);
        goBackwardDistance(20.0, 80);
        delay(500);
        stopMotors();
      `

			const bytecode = CppParser.cppToByte(code)

			// Check the first instruction is MOTOR_FORWARD_TIME
			expect(bytecode[0]).toBe(BytecodeOpCode.MOTOR_FORWARD_TIME)
			expect(bytecode[1]).toBe(3.0)
			expect(bytecode[2]).toBe(60)

			// Check the fifth instruction is MOTOR_BACKWARD_DISTANCE
			expect(bytecode[20]).toBe(BytecodeOpCode.MOTOR_BACKWARD_DISTANCE)
			expect(bytecode[21]).toBe(20.0)
			expect(bytecode[22]).toBe(80)
		})
	})

	describe("Motor Commands in Control Structures", () => {
		test("should parse motor commands in if-else blocks", () => {
			const code = `
        if (Sensors::getInstance().getPitch() > 10) {
          goForward(70);
        } else {
          goBackward(70);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find motor commands in the bytecode
			let forwardFound = false
			let backwardFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_FORWARD) {
					forwardFound = true
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_BACKWARD) {
					backwardFound = true
				}
			}

			expect(forwardFound).toBe(true)
			expect(backwardFound).toBe(true)
		})

		test("should parse motor commands in for loops", () => {
			const code = `
        for (int i = 0; i < 3; i++) {
          goForward(50);
          delay(500);
          turn(CLOCKWISE, 120);
          delay(500);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find motor commands in the bytecode
			let forwardCount = 0
			let turnCount = 0

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_FORWARD) {
					forwardCount++
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_TURN) {
					turnCount++
				}
			}

			// Should find one of each even though it's in a loop
			expect(forwardCount).toBe(1)
			expect(turnCount).toBe(1)
		})

		test("should parse motor commands in while loops", () => {
			const code = `
        while(true) {
          goForwardDistance(10.0, 60);
          delay(1000);
          turn(COUNTERCLOCKWISE, 180);
          delay(1000);
          goBackwardDistance(10.0, 60);
          delay(1000);
          turn(CLOCKWISE, 180);
          delay(1000);
        }
      `

			const bytecode = CppParser.cppToByte(code)

			// Find motor commands in the bytecode
			let forwardFound = false
			let backwardFound = false
			let clockwiseTurnFound = false
			let counterclockwiseTurnFound = false

			for (let i = 0; i < bytecode.length; i += 5) {
				if (bytecode[i] === BytecodeOpCode.MOTOR_FORWARD_DISTANCE) {
					forwardFound = true
				} else if (bytecode[i] === BytecodeOpCode.MOTOR_BACKWARD_DISTANCE) {
					backwardFound = true
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
