// Updated career-trigger.test.ts
import { jest } from "@jest/globals"

// TODO: Will we need to do this for all tests?
// Mock SecretsManager FIRST, before ANY other imports
jest.mock("@/classes/aws/secrets-manager", () => ({
	default: {
		getInstance: jest.fn().mockReturnValue({
			getSecret: jest.fn().mockImplementation((key: string) => {
				const secrets: Record<string, string> = {
					"JWT_KEY": "test-jwt-secret-key",
					"EMAIL_ENCRYPTION_KEY": "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==",
					"GOOGLE_CLIENT_ID": "test-google-client-id",
					"PIP_HARDWARE_VERSION": "1.0.0",
				}
				return Promise.resolve(secrets[key] || "mock-secret")
			})
		})
	}
}))

// // Mock the getDecodedId function with manual mock
jest.mock("@/utils/auth-helpers/get-decoded-id")

// eslint-disable-next-line no-duplicate-imports
import { describe, it, expect, beforeAll } from "@jest/globals"
import request from "supertest"
import { Express } from "express"
import {
	createTestApp,
	createAuthenticatedRequest,
} from "../../../utils/app-test-setup"
import { CareerType } from "@bluedotrobots/common-ts/protocol"

describe("POST /career-quest/career-trigger", () => {
	let testApp: Express

	beforeAll(() => {
		// Create test app AFTER mocks are established
		testApp = createTestApp()
		// Verify our mocks are working
		console.log("Test environment set up")
	})

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

		// Debug the JWT token
		console.log("Generated JWT:", auth.token)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
			.send({
				careerType: CareerType.MEET_PIP,
				triggerMessageType: 1
			})

		console.log("Response status:", response.status)
		console.log("Response body:", response.body)

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with missing careerType", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
			.send({
				pipUUID: "test-pip-uuid",
				triggerMessageType: 1
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with empty pipUUID", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
			.send({
				pipUUID: "",
				careerType: CareerType.MEET_PIP,
				triggerMessageType: 1
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with missing triggerMessageType", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
			.send({
				pipUUID: "test-pip-uuid",
				careerType: CareerType.MEET_PIP
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with invalid data types", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
			.send({
				pipUUID: 123, // Should be string
				careerType: CareerType.MEET_PIP,
				triggerMessageType: "invalid" // Should be number
			})

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should handle valid career trigger request", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
			.send({
				pipUUID: "abc12",
				careerType: CareerType.MEET_PIP,
				triggerMessageType: 0
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
			.set("Cookie", auth.cookie)
			.set("Content-Type", "application/json")
			.send("{\"pipUUID\": invalid json}")

		expect(response.status).toBe(400)
	})
})
