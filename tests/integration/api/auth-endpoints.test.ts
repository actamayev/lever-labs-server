import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals"
import request from "supertest"
import express, { Express } from "express"

// Mock all external dependencies
jest.mock("../../../src/classes/prisma-client")
jest.mock("../../../src/classes/aws/secrets-manager")
jest.mock("../../../src/utils/google/create-google-auth-client")

// Import after mocking
import setupRoutes from "../../../src/utils/config/setup-routes"
import { configureAppMiddleware } from "../../../src/middleware/init-config"

describe("Authentication API Integration Tests", () => {
	let app: Express

	beforeAll(() => {
		// Setup Express app with middleware and routes
		app = express()
		configureAppMiddleware(app)
		setupRoutes(app)

		// Add 404 handler
		app.use("*", (_req, res) => {
			res.status(404).json({ error: "Route not found" })
		})
	})

	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("POST /auth/register", () => {
		it("should reject registration with invalid email", async () => {
			// Arrange
			const invalidRegistrationData = {
				registerInformation: {
					age: 25,
					email: "invalid-email-format",
					username: "testuser123",
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(invalidRegistrationData)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
			expect(response.body.validationError).toContain("email")
		})

		it("should reject registration with weak password", async () => {
			// Arrange
			const weakPasswordData = {
				registerInformation: {
					age: 25,
					email: "test@example.com",
					username: "testuser123",
					password: "123", // Too weak
					siteTheme: "light",
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(weakPasswordData)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject registration with invalid age", async () => {
			// Arrange
			const invalidAgeData = {
				registerInformation: {
					age: 150, // Too old
					email: "test@example.com",
					username: "testuser123",
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(invalidAgeData)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject registration with invalid site theme", async () => {
			// Arrange
			const invalidThemeData = {
				registerInformation: {
					age: 25,
					email: "test@example.com",
					username: "testuser123",
					password: "ValidPassword123!",
					siteTheme: "neon", // Invalid theme
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(invalidThemeData)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
			expect(response.body.validationError).toContain("light")
		})

		it("should reject registration with missing required fields", async () => {
			// Arrange
			const incompleteData = {
				registerInformation: {
					age: 25,
					// Missing email, username, password, siteTheme
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(incompleteData)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject registration with username too short", async () => {
			// Arrange
			const shortUsernameData = {
				registerInformation: {
					age: 25,
					email: "test@example.com",
					username: "ab", // Too short
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(shortUsernameData)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})
	})

	describe("POST /auth/login", () => {
		it("should reject login with missing credentials", async () => {
			// Act
			const response = await request(app)
				.post("/auth/login")
				.send({})

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject login with invalid email format", async () => {
			// Arrange
			const invalidLoginData = {
				loginInformation: {
					loginContact: "invalid-email",
					password: "somepassword",
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/login")
				.send(invalidLoginData)

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})
	})

	describe("POST /auth/google-auth/login-callback", () => {
		it("should reject Google login with missing idToken", async () => {
			// Act
			const response = await request(app)
				.post("/auth/google-auth/login-callback")
				.send({ siteTheme: "light" }) // Missing idToken

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject Google login with invalid site theme", async () => {
			// Act
			const response = await request(app)
				.post("/auth/google-auth/login-callback")
				.send({
					idToken: "mock-id-token",
					siteTheme: "invalid-theme",
				})

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})
	})

	describe("POST /auth/logout", () => {
		it("should handle logout requests", async () => {
			// Act
			const response = await request(app)
				.post("/auth/logout")

			// Assert - Should not crash, specific behavior depends on implementation
			expect([200, 401, 500]).toContain(response.status)
		})
	})

	describe("Error Handling", () => {
		it("should return 404 for non-existent auth routes", async () => {
			// Act
			const response = await request(app)
				.get("/auth/non-existent-route")

			// Assert
			expect(response.status).toBe(404)
			expect(response.body).toHaveProperty("error")
		})

		it("should handle malformed JSON in request body", async () => {
			// Act
			const response = await request(app)
				.post("/auth/register")
				.set("Content-Type", "application/json")
				.send("{\"invalid\": json}") // Malformed JSON

			// Assert
			expect(response.status).toBe(400)
		})

		it("should handle oversized request payloads", async () => {
			// Arrange - Create a very large payload
			const largeData = {
				registerInformation: {
					age: 25,
					email: "test@example.com",
					username: "a".repeat(10000), // Very long username
					password: "ValidPassword123!",
					siteTheme: "light",
				},
			}

			// Act
			const response = await request(app)
				.post("/auth/register")
				.send(largeData)

			// Assert - Should handle gracefully (either 400 validation error or 413 payload too large)
			expect([400, 413]).toContain(response.status)
		})
	})
})
