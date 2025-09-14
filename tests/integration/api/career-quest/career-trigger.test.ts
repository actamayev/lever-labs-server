import { jest } from "@jest/globals"

// CRITICAL: Mock all external dependencies BEFORE any other imports
jest.mock("../../../../src/classes/aws/secrets-manager", () => ({
	default: {
		getInstance: jest.fn().mockReturnValue({
			getSecret: jest.fn().mockImplementation((key: string) => {
				if (key === "JWT_KEY") {
					return Promise.resolve("test-jwt-secret-key")
				}
				return Promise.resolve("mock-secret")
			})
		})
	}
}))

// Mock other dependencies
jest.mock("../../../../src/classes/prisma-client")
jest.mock("../../../../src/classes/esp32/esp32-socket-manager")
jest.mock("../../../../src/classes/browser-socket-manager")
jest.mock("../../../../src/classes/openai-client")
jest.mock("../../../../src/utils/google/create-google-auth-client")

// eslint-disable-next-line no-duplicate-imports
import { describe, it, expect } from "@jest/globals"
import request from "supertest"
import {
	setupTestApp,
	createAuthenticatedRequest
} from "../../../utils/app-test-setup"

describe("POST /career-quest/career-trigger", () => {
	const testApp = setupTestApp()

	it("should reject unauthenticated requests", async () => {
		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.send({
				pipUUID: "test-pip-uuid",
				message: "Test trigger message"
			})

		expect(response.status).toBe(401)
		expect(response.body).toHaveProperty("error")
	})

	it("should reject request with missing pipUUID", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set(auth.headers)
			.send({
				message: "Test trigger message"
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with missing message", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set(auth.headers)
			.send({
				pipUUID: "test-pip-uuid"
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with empty pipUUID", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set(auth.headers)
			.send({
				pipUUID: "",
				message: "Test trigger message"
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with empty message", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set(auth.headers)
			.send({
				pipUUID: "test-pip-uuid",
				message: ""
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with invalid data types", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set(auth.headers)
			.send({
				pipUUID: 123, // Should be string
				message: true // Should be string
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should handle valid career trigger request", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set(auth.headers)
			.send({
				pipUUID: "test-pip-uuid-123",
				message: "Valid trigger message for career quest"
			})

		// Should not be a validation error or unauthorized
		expect(response.status).not.toBe(400)
		expect(response.status).not.toBe(401)
	})

	it("should handle malformed JSON in request body", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set(auth.headers)
			.set("Content-Type", "application/json")
			.send("{\"pipUUID\": invalid json}")

		expect(response.status).toBe(400)
	})
})
