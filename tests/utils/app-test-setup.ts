// tests/utils/express-app-factory.ts
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
