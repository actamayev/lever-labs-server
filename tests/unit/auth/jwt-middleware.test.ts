import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { Request, Response, NextFunction } from "express"

// Mock dependencies
jest.mock("@/classes/aws/secrets-manager", () => ({
	default: {
		getInstance: jest.fn().mockReturnValue({
			getSecret: jest.fn().mockImplementation(() => Promise.resolve("test-jwt-secret-key")),
		}),
	},
}))

const mockGetDecodedId = jest.fn() as jest.MockedFunction<(token: string) => Promise<number>>
const mockFindUserById = jest.fn() as jest.MockedFunction<(userId: number) => Promise<ExtendedCredentials | null>>
const mockGetAuthTokenFromCookies = jest.fn() as jest.MockedFunction<(req: Request) => string | null>

jest.mock("@/utils/auth-helpers/get-decoded-id", () => {
	return {
		__esModule: true,
		default: mockGetDecodedId,
	}
})

jest.mock("@/middleware/cookie-helpers", () => ({
	getAuthTokenFromCookies: mockGetAuthTokenFromCookies,
}))

jest.mock("@/db-operations/read/find/find-user", () => ({
	findUserById: mockFindUserById,
}))

import jwtVerifyAttachUserId from "@/middleware/jwt/jwt-verify-attach-user-id"
import jwtVerifyAttachUser from "@/middleware/jwt/jwt-verify-attach-user"
import { AuthMethods, SiteThemes } from "@prisma/client"

describe("JWT Middleware", () => {
	let mockRequest: Partial<Request> & { userId?: number; user?: unknown } & { cookies: Record<string, string> }
	let mockResponse: Partial<Response>
	let mockNext: NextFunction
	let mockJson: jest.MockedFunction<(body: unknown) => Response>
	let mockStatus: jest.MockedFunction<(code: number) => Response>

	beforeEach(() => {
		mockJson = jest.fn()
		mockStatus = jest.fn<(code: number) => Response>().mockReturnValue({ json: mockJson } as unknown as Response)

		mockRequest = {
			cookies: {},
			headers: {},
			signedCookies: {},
		}

		mockResponse = {
			status: mockStatus,
			json: mockJson,
		}

		mockNext = jest.fn()

		// Reset all mocks
		jest.clearAllMocks()
	})

	describe("jwtVerifyAttachUserId", () => {

		it("should attach userId to request when token is valid", async () => {
			// Arrange
			const mockToken = "valid-jwt-token"
			const mockUserId = 123

			mockGetAuthTokenFromCookies.mockReturnValue(mockToken)
			mockGetDecodedId.mockResolvedValue(mockUserId)

			// Act
			await jwtVerifyAttachUserId(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockGetAuthTokenFromCookies).toHaveBeenCalledWith(mockRequest as Request)
			expect(mockGetDecodedId).toHaveBeenCalledWith(mockToken)
			expect(mockRequest.userId).toBe(mockUserId)
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
		})

		it("should return 401 when no token is provided", async () => {
			// Arrange
			mockGetAuthTokenFromCookies.mockReturnValue(null)

			// Act
			await jwtVerifyAttachUserId(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(401)
			expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized User" })
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should return 401 when token is invalid", async () => {
			// Arrange
			const mockToken = "invalid-jwt-token"

			mockGetAuthTokenFromCookies.mockReturnValue(mockToken)
			mockGetDecodedId.mockRejectedValue(new Error("Invalid token"))

			// Act
			await jwtVerifyAttachUserId(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(401)
			expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized User" })
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should return 401 when token decoding fails", async () => {
			// Arrange
			const mockToken = "malformed-token"

			mockGetAuthTokenFromCookies.mockReturnValue(mockToken)
			mockGetDecodedId.mockRejectedValue(new Error("JsonWebTokenError"))

			// Act
			await jwtVerifyAttachUserId(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(401)
			expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized User" })
			expect(mockNext).not.toHaveBeenCalled()
		})
	})

	describe("jwtVerifyAttachUser", () => {

		it("should attach full user object to request when token and user are valid", async () => {
			// Arrange
			const mockToken = "valid-jwt-token"
			const mockUserId = 123
			const mockUser = {
				user_id: mockUserId,
				username: "testuser",
				email__encrypted: "encrypted-email",
				is_active: true,
				default_site_theme: "light" as SiteThemes,
				auth_method: "blue_dot" as AuthMethods,
				name: "testuser",
				age: 20,
				password: "testpassword",
				sandbox_notes_open: false,
				created_at: new Date(),
				updated_at: new Date(),
			} as ExtendedCredentials

			mockRequest.cookies = { auth_token: mockToken }
			mockGetAuthTokenFromCookies.mockReturnValue(mockToken)
			mockGetDecodedId.mockResolvedValue(mockUserId)
			mockFindUserById.mockResolvedValue(mockUser)

			// Act
			await jwtVerifyAttachUser(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockGetAuthTokenFromCookies).toHaveBeenCalledWith(mockRequest as Request)
			expect(mockGetDecodedId).toHaveBeenCalledWith(mockToken)
			expect(mockFindUserById).toHaveBeenCalledWith(mockUserId)
			expect(mockRequest.user).toBe(mockUser)
			expect(mockNext).toHaveBeenCalled()
			expect(mockStatus).not.toHaveBeenCalled()
		})

		it("should return 401 when user is not found in database", async () => {
			// Arrange
			const mockToken = "valid-jwt-token"
			const mockUserId = 999 // Non-existent user

			mockGetAuthTokenFromCookies.mockReturnValue(mockToken)
			mockGetDecodedId.mockResolvedValue(mockUserId)
			mockFindUserById.mockResolvedValue(null)

			// Act
			await jwtVerifyAttachUser(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(401)
			expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized User" })
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should validate cookie structure before processing", async () => {
			// Arrange
			mockRequest.cookies = {} // Missing auth_token
			mockGetAuthTokenFromCookies.mockReturnValue(null)

			// Act
			await jwtVerifyAttachUser(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(401)
			expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized User" })
			expect(mockNext).not.toHaveBeenCalled()
		})

		it("should handle database errors gracefully", async () => {
			// Arrange
			const mockToken = "valid-jwt-token"
			const mockUserId = 123

			mockGetAuthTokenFromCookies.mockReturnValue(mockToken)
			mockGetDecodedId.mockResolvedValue(mockUserId)
			mockFindUserById.mockRejectedValue(new Error("Database connection failed"))

			// Act
			await jwtVerifyAttachUser(mockRequest as Request, mockResponse as Response, mockNext)

			// Assert
			expect(mockStatus).toHaveBeenCalledWith(401)
			expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized User" })
			expect(mockNext).not.toHaveBeenCalled()
		})
	})
})
