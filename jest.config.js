module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src", "<rootDir>/tests"],
	testMatch: [
		"**/__tests__/**/*.ts",
		"**/?(*.)+(spec|test).ts"
	],
	transform: {
		"^.+\\.ts$": "ts-jest",
	},
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/index.ts", // Exclude main entry point
		"!src/prisma/seed.ts", // Exclude seed file
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
	testTimeout: 30000, // 30 seconds for database operations
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
}
