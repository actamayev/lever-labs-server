import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { Request, Response, NextFunction } from "express"

import validateRegister from "../../../src/middleware/request-validation/auth/validate-register"
import validateCppCode from "../../../src/middleware/request-validation/sandbox/validate-cpp-code"
import { validateLedColorsDirectly } from "../../../src/middleware/request-validation/internal/validate-led-colors"
import validateSendChallengeMessage from "../../../src/middleware/request-validation/chat/validate-send-challenge-message"

describe("Request Validation Middleware", () => {
	let mockRequest: Partial<Request>
	let mockResponse: Partial<Response>
	let mockNext: NextFunction
	let mockJson: jest.MockedFunction<(...args: unknown[]) => unknown>
	let mockStatus: jest.MockedFunction<(...args: unknown[]) => unknown>

	beforeEach(() => {
		mockJson = jest.fn()
		mockStatus = jest.fn().mockReturnValue({ json: mockJson })

		mockRequest = {
			body: {},
			params: {},
			query: {},
		}

		mockResponse = {
			status: mockStatus,
			json: mockJson,
		} as Partial<Response>

		mockNext = jest.fn()

		// Reset all mocks
		jest.clearAllMocks()
	})

	describe("validateRegister", () => {
		it("should pass validation with valid registration data", () => {
			// Arrange
			mockRequest.body = {
				registerInformation: {
					age: 25,
					email: "test@example.com",
					username: "testuser123",
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			validateRegister(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
		})

		it("should reject registration with missing fields", () => {
			// Arrange
			mockRequest.body = {
				registerInformation: {
					age: 25,
					// Missing email, username, password, siteTheme
				},
			}

			// Act
			validateRegister(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockJson).toHaveBeenCalledWith({
				validationError: expect.stringContaining("required"),
			})
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject invalid email format", () => {
			// Arrange
			mockRequest.body = {
				registerInformation: {
					age: 25,
					email: "invalid-email",
					username: "testuser123",
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			validateRegister(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject username that is too short", () => {
			// Arrange
			mockRequest.body = {
				registerInformation: {
					age: 25,
					email: "test@example.com",
					username: "ab", // Too short (< 3 chars)
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			validateRegister(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject invalid site theme", () => {
			// Arrange
			mockRequest.body = {
				registerInformation: {
					age: 25,
					email: "test@example.com",
					username: "testuser123",
					password: "ValidPassword123!",
					siteTheme: "invalid-theme",
				},
			}

			// Act
			validateRegister(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should trim email whitespace", () => {
			// Arrange
			mockRequest.body = {
				registerInformation: {
					age: 25,
					email: "test@example.com   ", // Trailing whitespace
					username: "testuser123",
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			validateRegister(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			// Joi's trim() modifies the validated value, so we check that validation passes
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
		})
	})

	describe("validateCppCode", () => {
		it("should pass validation with valid C++ code data", () => {
			// Arrange
			mockRequest.body = {
				pipUUID: "ABC12", // 5 alphanumeric characters
				cppCode: "#include <iostream>\nint main() { return 0; }",
			}

			// Act
			validateCppCode(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
		})

		it("should reject missing pipUUID", () => {
			// Arrange
			mockRequest.body = {
				cppCode: "#include <iostream>\nint main() { return 0; }",
				// Missing pipUUID
			}

			// Act
			validateCppCode(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject missing cppCode", () => {
			// Arrange
			mockRequest.body = {
				pipUUID: "ABC12",
				// Missing cppCode
			}

			// Act
			validateCppCode(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should handle validation errors gracefully", () => {
			// Arrange
			mockRequest.body = null // Invalid body

			// Act
			validateCppCode(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})
	})

	describe("validateLedColorsDirectly", () => {
		it("should pass validation with valid LED color data", () => {
			// Arrange
			mockRequest.body = {
				pipUUID: "ABC12",
				topLeftColor: { r: 255, g: 0, b: 0 },
				topRightColor: { r: 0, g: 255, b: 0 },
				middleLeftColor: { r: 0, g: 0, b: 255 },
				middleRightColor: { r: 255, g: 255, b: 0 },
				backLeftColor: { r: 255, g: 0, b: 255 },
				backRightColor: { r: 0, g: 255, b: 255 },
			}

			// Act
			validateLedColorsDirectly(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
		})

		it("should reject invalid RGB values (out of range)", () => {
			// Arrange
			mockRequest.body = {
				pipUUID: "ABC12",
				topLeftColor: { r: 256, g: 0, b: 0 }, // Invalid: > 255
				topRightColor: { r: 0, g: 255, b: 0 },
				middleLeftColor: { r: 0, g: 0, b: 255 },
				middleRightColor: { r: 255, g: 255, b: 0 },
				backLeftColor: { r: 255, g: 0, b: 255 },
				backRightColor: { r: 0, g: 255, b: 255 },
			}

			// Act
			validateLedColorsDirectly(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject negative RGB values", () => {
			// Arrange
			mockRequest.body = {
				pipUUID: "ABC12",
				topLeftColor: { r: -1, g: 0, b: 0 }, // Invalid: < 0
				topRightColor: { r: 0, g: 255, b: 0 },
				middleLeftColor: { r: 0, g: 0, b: 255 },
				middleRightColor: { r: 255, g: 255, b: 0 },
				backLeftColor: { r: 255, g: 0, b: 255 },
				backRightColor: { r: 0, g: 255, b: 255 },
			}

			// Act
			validateLedColorsDirectly(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject missing LED color objects", () => {
			// Arrange
			mockRequest.body = {
				pipUUID: "ABC12",
				topLeftColor: { r: 255, g: 0, b: 0 },
				// Missing other LED colors
			}

			// Act
			validateLedColorsDirectly(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})
	})

	describe("validateSendChallengeMessage", () => {
		it("should pass validation with valid challenge message data", () => {
			// Arrange
			mockRequest.body = {
				careerUUID: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4
				userCode: "int main() { return 0; }",
				message: "Can you help me fix this code?",
			}

			// Act
			validateSendChallengeMessage(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
			expect(mockJson).not.toHaveBeenCalled()
		})

		it("should accept empty userCode", () => {
			// Arrange
			mockRequest.body = {
				careerUUID: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4
				userCode: "", // Empty is allowed
				message: "I need help getting started",
			}

			// Act
			validateSendChallengeMessage(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
		})

		it("should reject invalid UUID format", () => {
			// Arrange
			mockRequest.body = {
				careerUUID: "invalid-uuid-format",
				userCode: "int main() { return 0; }",
				message: "Can you help me fix this code?",
			}

			// Act
			validateSendChallengeMessage(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject missing message", () => {
			// Arrange
			mockRequest.body = {
				careerUUID: "123e4567-e89b-12d3-a456-426614174000",
				userCode: "int main() { return 0; }",
				// Missing message
			}

			// Act
			validateSendChallengeMessage(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should reject unknown fields", () => {
			// Arrange
			mockRequest.body = {
				careerUUID: "123e4567-e89b-12d3-a456-426614174000",
				userCode: "int main() { return 0; }",
				message: "Can you help me fix this code?",
				extraField: "should not be allowed", // Unknown field
			}

			// Act
			validateSendChallengeMessage(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})
	})
})
