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
				getSecret: jest.fn().mockImplementation((key: unknown) => {
					const secretKey = key as string
					const secrets: Record<string, string> = {
						"JWT_KEY": "test-jwt-secret-key",
						"GOOGLE_CLIENT_ID": "test-google-client-id",
						"GOOGLE_CLIENT_SECRET": "test-google-client-secret",
						"EMAIL_ENCRYPTION_KEY": "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==",
						"BDR_S3_BUCKET": "test-bdr-s3-bucket",
						"FIRMWARE_S3_BUCKET": "test-firmware-s3-bucket",
						"DATABASE_URL": "test-database-url",
						"AWS_ACCESS_KEY_ID": "test-aws-access-key-id",
						"AWS_SECRET_ACCESS_KEY": "test-aws-secret-access-key",
						"OPENROUTER_API_KEY": "test-openrouter-api-key",
						"PIP_HARDWARE_VERSION": "1.0.0",
					}
					return Promise.resolve(secrets[secretKey] || "mock-secret")
				})
			})
		}
	}))
}

// JWT Test Utilities
interface TestUser {
	userId: number
	email?: string
	username?: string
}

function createTestJWT(user: TestUser): string {
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
