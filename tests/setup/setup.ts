import { jest, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"

// Global test setup
beforeAll(() => {
	// Set test environment variables
	process.env.NODE_ENV = "test" as "production"
	process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test_db"

	// Mock console methods to reduce noise in tests
	global.console = {
		...console,
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	}
})

afterAll(async () => {
	// Cleanup after all tests
})

beforeEach(() => {
	// Reset mocks before each test
	jest.clearAllMocks()
})

afterEach(() => {
	// Cleanup after each test
	jest.restoreAllMocks()
})
