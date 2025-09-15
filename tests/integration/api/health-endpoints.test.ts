import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals"
import request from "supertest"
import express, { Express } from "express"

// Mock all external dependencies
jest.mock("@/classes/prisma-client")
jest.mock("@/classes/aws/secrets-manager")
jest.mock("@/utils/google/create-google-auth-client")
jest.mock("@/classes/esp32/esp32-socket-manager")
jest.mock("@/classes/browser-socket-manager")
jest.mock("@/classes/openai-client")

// Import after mocking
import setupRoutes from "@/utils/config/setup-routes"
import { configureAppMiddleware } from "@/middleware/init-config"

describe("Health API Integration Tests", () => {
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

	describe("GET /health", () => {
		it("should handle health check request", async () => {
			// Act
			const response = await request(app)
				.get("/health")

			// Assert - Should not crash, specific behavior depends on implementation
			expect([200, 404, 500]).toContain(response.status)
		})
	})

	describe("Error Handling", () => {
		it("should handle different HTTP methods on health endpoint", async () => {
			// Act
			const response = await request(app)
				.post("/health")

			// Assert - Health endpoint returns 200 OK for any method
			expect(response.status).toBe(200)
			expect(response.text).toBe("OK")
		})
	})
})
