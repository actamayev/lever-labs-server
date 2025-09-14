// tests/utils/express-app-factory.ts
import { jest } from "@jest/globals"
import express, { Express } from "express"
import jwt from "jsonwebtoken"
import { configureAppMiddleware } from "@/middleware/init-config"
import setupRoutes from "@/utils/config/setup-routes"
import { AUTH_COOKIE_NAME } from "@/middleware/cookie-helpers"

// Factory function to create a test Express app
// Call this AFTER mocks are set up in your test file
export function createTestApp(): Express {
	const app = express()
	configureAppMiddleware(app)
	setupRoutes(app)

	// Add 404 handler
	app.use("*", (_req, res) => {
		res.status(404).json({ error: "Route not found" })
	})

	return app
}

export function mockAllExternalDependencies(): void {
	// Mock all external dependencies BEFORE any imports
	jest.mock("@/classes/prisma-client")
	jest.mock("@/classes/esp32/esp32-socket-manager")
	jest.mock("@/classes/browser-socket-manager")
	jest.mock("@/classes/openai-client")
	jest.mock("@/utils/google/create-google-auth-client")

	// Mock SecretsManager with the correct JWT_KEY
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
}

// JWT Test Utilities
export interface TestUser {
	userId: number
	email?: string
	username?: string
}

export function createTestJWT(user: TestUser): string {
	const testSecret = "test-jwt-secret-key"
	return jwt.sign(
		{ userId: user.userId },
		testSecret,
		{ expiresIn: "1h" }
	)
}

export function createAuthenticatedRequest(user: TestUser): {
	token: string
	cookie: string
	headers: { Cookie: string }
} {
	const token = createTestJWT(user)
	return {
		token,
		cookie: `${AUTH_COOKIE_NAME}=${token}`,
		headers: {
			Cookie: `${AUTH_COOKIE_NAME}=${token}`
		}
	}
}
