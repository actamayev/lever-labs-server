// jest.config.ts
import type { Config } from "jest"

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/tests", "<rootDir>/src"],
	testMatch: ["**/*.test.ts"],

	// Global setup files that run before the test framework is installed
	setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],

	// Module name mapper for path aliases if you use them
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^@test/(.*)$": "<rootDir>/tests/$1"
	},

	// Clear mocks between tests
	clearMocks: true,

	// Collect coverage
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/**/*.test.ts",
		"!src/**/index.ts"
	],

	// Transform options
	transform: {
		"^.+\\.ts$": ["ts-jest", {
			tsconfig: {
				// Your TypeScript config for tests
				esModuleInterop: true,
				allowSyntheticDefaultImports: true
			}
		}]
	}
}

export default config
