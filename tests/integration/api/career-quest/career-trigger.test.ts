// Updated career-trigger.test.ts
import { describe, it, expect, beforeAll } from "@jest/globals"
import request from "supertest"
import {
	createTestApp,
	createAuthenticatedRequest,
	mockAllExternalDependencies,
} from "../../../utils/app-test-setup"

// Mock dependencies BEFORE any imports
mockAllExternalDependencies()

describe("POST /career-quest/career-trigger", () => {
	const testApp = createTestApp()

	beforeAll(() => {
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
			.set("Cookie", auth.cookie) // Use set() instead of set(auth.headers)
			.send({
				message: "Test trigger message"
			})

		console.log("Response status:", response.status)
		console.log("Response body:", response.body)

		expect(response.status).toBe(400)
		expect(response.body).toHaveProperty("validationError")
	})

	it("should reject request with missing message", async () => {
		const testUser = { userId: 123 }
		const auth = createAuthenticatedRequest(testUser)

		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
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
			.set("Cookie", auth.cookie)
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
			.set("Cookie", auth.cookie)
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
			.set("Cookie", auth.cookie)
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
			.set("Cookie", auth.cookie)
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
			.set("Cookie", auth.cookie)
			.set("Content-Type", "application/json")
			.send("{\"pipUUID\": invalid json}")

		expect(response.status).toBe(400)
	})

	// Additional debug test to isolate the JWT issue
	it("DEBUG: should verify JWT middleware is working", async () => {
		const testUser = { userId: 999 }
		const auth = createAuthenticatedRequest(testUser)

		console.log("🔍 Debug test - checking if JWT middleware works at all")
		console.log("Cookie being sent:", auth.cookie)

		// Try a simple authenticated endpoint to see if the issue is specific to this route
		const response = await request(testApp)
			.post("/career-quest/career-trigger")
			.set("Cookie", auth.cookie)
			.send({
				pipUUID: "debug-test-uuid",
				message: "Debug message to test JWT"
			})

		console.log("Debug response status:", response.status)
		console.log("Debug response body:", response.body)

		if (response.status === 401) {
			console.log("❌ JWT middleware is not working")
		} else {
			console.log("✅ JWT middleware is working - issue is elsewhere")
		}
	})
})
