import { beforeAll, beforeEach, jest } from "@jest/globals"
import express, { Express } from "express"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import setupRoutes from "../../src/utils/config/setup-routes"
import { configureAppMiddleware } from "../../src/middleware/init-config"
import { AUTH_COOKIE_NAME } from "../../src/middleware/cookie-helpers"

export function setupTestApp(): Express {
	const app: Express = express()

	beforeAll(() => {
		// Ensure cookie parser is configured
		app.use(cookieParser())

		// Setup Express app with middleware and routes
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

	// Return app for type safety - will be undefined until beforeAll runs
	return app
}

export function mockAllExternalDependencies(): void {
	// Mock all external dependencies BEFORE any imports
	jest.mock("../../src/classes/prisma-client")
	jest.mock("../../src/classes/esp32/esp32-socket-manager")
	jest.mock("../../src/classes/browser-socket-manager")
	jest.mock("../../src/classes/openai-client")
	jest.mock("../../src/utils/google/create-google-auth-client")

	// Mock SecretsManager with the correct JWT_KEY
	jest.mock("../../src/classes/aws/secrets-manager", () => ({
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

export function createAuthenticatedRequest(user: TestUser): { token: string; cookie: string; headers: { Cookie: string } } {
	const token = createTestJWT(user)
	return {
		token,
		cookie: `${AUTH_COOKIE_NAME}=${token}`,
		headers: {
			Cookie: `${AUTH_COOKIE_NAME}=${token}`
		}
	}
}

export function mockJWTAuthentication(): void {
	// This function is no longer needed since we handle it in mockAllExternalDependencies
	// Keep for backwards compatibility
}
