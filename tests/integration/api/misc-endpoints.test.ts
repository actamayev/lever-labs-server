import { describe, it, expect } from "@jest/globals"
import request from "supertest"
import { createTestApp } from "../../utils/app-test-setup"

describe("Misc API Integration Tests", () => {
	const testApp = createTestApp()

	describe("POST /misc/subscribe-for-email-updates", () => {
		it("should reject request with missing email", async () => {
			// Act
			const response = await request(testApp)
				.post("/misc/subscribe-for-email-updates")
				.send({})

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject request with invalid email format", async () => {
			// Act
			const response = await request(testApp)
				.post("/misc/subscribe-for-email-updates")
				.send({
					email: "invalid-email-format"
				})

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject request with empty email", async () => {
			// Act
			const response = await request(testApp)
				.post("/misc/subscribe-for-email-updates")
				.send({
					email: ""
				})

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})

		it("should reject request with invalid email type", async () => {
			// Act
			const response = await request(testApp)
				.post("/misc/subscribe-for-email-updates")
				.send({
					email: 123 // Should be string
				})

			// Assert
			expect(response.status).toBe(400)
			expect(response.body).toHaveProperty("validationError")
		})
	})

	describe("Error Handling", () => {
		it("should return 404 for non-existent misc routes", async () => {
			// Act
			const response = await request(testApp)
				.get("/misc/non-existent-route")

			// Assert
			expect(response.status).toBe(404)
			expect(response.body).toHaveProperty("error")
		})

		it("should handle malformed JSON in request body", async () => {
			// Act
			const response = await request(testApp)
				.post("/misc/subscribe-for-email-updates")
				.set("Content-Type", "application/json")
				.send("{\"invalid\": json}") // Malformed JSON

			// Assert
			expect(response.status).toBe(400)
		})
	})
})
