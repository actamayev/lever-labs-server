import { jest, beforeAll, beforeEach, afterEach } from "@jest/globals"

// Mock SecretsManager globally - this must be done before any imports
jest.mock("../src/classes/aws/secrets-manager", () => ({
	default: {
		getInstance: jest.fn().mockReturnValue({
			getSecret: jest.fn().mockImplementation((key: string) => {
				const secrets: Record<string, string> = {
					"JWT_KEY": "test-jwt-secret-key",
					"EMAIL_ENCRYPTION_KEY": "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==",
					"GOOGLE_CLIENT_ID": "test-google-client-id",
					"PIP_HARDWARE_VERSION": "1.0.0"
				}
				return Promise.resolve(secrets[key] || "mock-secret")
			})
		})
	}
}))

// Mock other critical dependencies
jest.mock("../src/classes/prisma-client")
jest.mock("../src/classes/esp32/esp32-socket-manager")
jest.mock("../src/classes/browser-socket-manager")
jest.mock("../src/classes/openai-client")
jest.mock("../src/utils/google/create-google-auth-client")

// Global test setup
beforeAll(() => {
	// Set test environment variables
	process.env.NODE_ENV = "test"
	process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test_db"

	// Mock console methods to reduce noise in tests
	global.console = {
		...console,
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	}
})

beforeEach(() => {
	// Reset mocks before each test
	jest.clearAllMocks()
})

afterEach(() => {
	// Cleanup after each test if needed
})
