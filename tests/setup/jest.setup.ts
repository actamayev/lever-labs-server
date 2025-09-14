// tests/setup/jest.setup.ts
import { jest, beforeAll, beforeEach, afterEach } from "@jest/globals"

// IMPORTANT: This file runs AFTER the test file has been loaded,
// so mocks defined here won't affect imports in test files.
// For mocking modules that are imported by your source code,
// you MUST use jest.mock() at the top of each test file.

// Global test setup
beforeAll(() => {
	// Set test environment variables
	process.env.NODE_ENV = undefined
	process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test_db"

	// Mock console methods to reduce noise in tests
	global.console = {
		...console,
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		log: console.log // Keep log for debugging
	}
})

beforeEach(() => {
	// Reset all mocks before each test
	jest.clearAllMocks()
})

afterEach(() => {
	// Cleanup after each test
	jest.restoreAllMocks()
})

// Export mock implementations that test files can use
export const mockSecrets: Record<string, string> = {
	"JWT_KEY": "test-jwt-secret-key",
	"EMAIL_ENCRYPTION_KEY": "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==",
	"GOOGLE_CLIENT_ID": "test-google-client-id",
	"PIP_HARDWARE_VERSION": "1.0.0"
}
