module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src/", "<rootDir>/tests/"],
	testMatch: ["**/*.test.ts"],
	setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
	transform: {
	  "^.+\\.tsx?$": "ts-jest",
	},
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
	// transform: {
	// 	"^.+\\.ts$": ["ts-jest", {
	// 		tsconfig: {
	// 			// Your TypeScript config for tests
	// 			esModuleInterop: true,
	// 			allowSyntheticDefaultImports: true
	// 		}
	// 	}]
	// }
}
