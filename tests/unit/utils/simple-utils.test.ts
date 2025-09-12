import { describe, it, expect } from "@jest/globals"
import { validateExtendedCredentials } from "../../../src/utils/type-guards"
import { SiteThemes, AuthMethods } from "@prisma/client"

describe("Utility Functions", () => {
	describe("Type Guards", () => {
		describe("validateExtendedCredentials", () => {
			it("should return true for valid encrypted email", () => {
				// Arrange
				const validCredentials = {
					user_id: 1,
					username: "testuser",
					email__encrypted: "dGVzdEBleGFtcGxlLmNvbQ==", // Valid base64
					is_active: true,
					age: 25,
					password: "hashedpassword",
					default_site_theme: "light" as SiteThemes,
					sandbox_notes_open: false,
					auth_method: "blue_dot" as AuthMethods,
					name: "Test User",
					created_at: new Date(),
					updated_at: new Date(),
				}

				// Act
				const result = validateExtendedCredentials(validCredentials)

				// Assert
				expect(result).toBe(true)
			})

			it("should return false for invalid encrypted email", () => {
				// Arrange
				const invalidCredentials = {
					user_id: 1,
					username: "testuser",
					email__encrypted: "invalid-base64!@#", // Invalid base64
					is_active: true,
					age: 25,
					password: "hashedpassword",
					default_site_theme: "light" as SiteThemes,
					sandbox_notes_open: false,
					auth_method: "blue_dot" as AuthMethods,
					name: "Test User",
					created_at: new Date(),
					updated_at: new Date(),
				}

				// Act
				const result = validateExtendedCredentials(invalidCredentials)

				// Assert
				expect(result).toBe(false)
			})
		})
	})

	describe("Basic Validation", () => {
		it("should validate base64 strings correctly", () => {
			// Test the regex from Encryptor directly
			const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

			expect(base64Regex.test("dGVzdA==")).toBe(true)
			expect(base64Regex.test("invalid!@#")).toBe(false)
			expect(base64Regex.test("")).toBe(true) // Empty string is valid
		})

		it("should handle edge cases in validation", () => {
			const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

			// Valid base64 strings
			expect(base64Regex.test("QQ==")).toBe(true)
			expect(base64Regex.test("QWE=")).toBe(true)
			expect(base64Regex.test("QWER")).toBe(true)

			// Invalid strings
			expect(base64Regex.test("Q")).toBe(false)
			expect(base64Regex.test("QQ=")).toBe(false) // Wrong padding
			expect(base64Regex.test("Q===")).toBe(false) // Too much padding
		})
	})
})
