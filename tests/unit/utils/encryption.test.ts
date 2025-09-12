/* eslint-disable @typescript-eslint/naming-convention */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import Encryptor from "../../../src/classes/encryptor"

describe("Encryption and Hashing Utilities", () => {
	describe("Encryptor", () => {
		let encryptor: Encryptor

		beforeEach(async () => {
			// Reset modules to ensure clean mocking
			jest.resetModules()

			// Mock SecretsManager
			jest.doMock("../../../src/classes/aws/secrets-manager", () => {
				return {
					__esModule: true,
					default: class MockSecretsManager {
						static getInstance = jest.fn().mockReturnValue({
							getSecret: jest.fn().mockImplementation((_key: unknown) => Promise.resolve("YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=")), // 32-byte base64 key
						})
					},
				}
			})

			// Import after mocking
			const { default: EncryptorClass } = await import("../../../src/classes/encryptor")
			encryptor = new EncryptorClass()
			jest.clearAllMocks()
		})

		describe("deterministicEncrypt", () => {
			it("should encrypt data consistently (deterministic)", async () => {
				// Arrange
				const plaintext = "test@example.com"
				const keyName: DeterministicEncryptionKeys = "EMAIL_ENCRYPTION_KEY"

				// Act
				const encrypted1 = await encryptor.deterministicEncrypt(plaintext, keyName)
				const encrypted2 = await encryptor.deterministicEncrypt(plaintext, keyName)

				// Assert
				expect(encrypted1).toBe(encrypted2) // Deterministic encryption
				expect(encrypted1).not.toBe(plaintext)
				expect(typeof encrypted1).toBe("string")
			})

			it("should produce different ciphertext for different plaintext", async () => {
				// Arrange
				const plaintext1 = "test1@example.com"
				const plaintext2 = "test2@example.com"
				const keyName: DeterministicEncryptionKeys = "EMAIL_ENCRYPTION_KEY"

				// Act
				const encrypted1 = await encryptor.deterministicEncrypt(plaintext1, keyName)
				const encrypted2 = await encryptor.deterministicEncrypt(plaintext2, keyName)

				// Assert
				expect(encrypted1).not.toBe(encrypted2)
			})

			it("should handle empty strings", async () => {
				// Arrange
				const plaintext = ""
				const keyName: DeterministicEncryptionKeys = "EMAIL_ENCRYPTION_KEY"

				// Act
				const encrypted = await encryptor.deterministicEncrypt(plaintext, keyName)

				// Assert
				expect(encrypted).toBeDefined()
				expect(typeof encrypted).toBe("string")
			})

			it("should handle special characters and unicode", async () => {
				// Arrange
				const plaintext = "test@example.com 🚀 ñáéíóú"
				const keyName: DeterministicEncryptionKeys = "EMAIL_ENCRYPTION_KEY"

				// Act
				const encrypted = await encryptor.deterministicEncrypt(plaintext, keyName)

				// Assert
				expect(encrypted).toBeDefined()
				expect(typeof encrypted).toBe("string")
			})
		})

		describe("deterministicDecrypt", () => {
			it("should decrypt data back to original plaintext", async () => {
				// Arrange
				const plaintext = "test@example.com"
				const keyName: DeterministicEncryptionKeys = "EMAIL_ENCRYPTION_KEY"

				// Act
				const encrypted = await encryptor.deterministicEncrypt(plaintext, keyName)
				const decrypted = await encryptor.deterministicDecrypt(encrypted, keyName)

				// Assert
				expect(decrypted).toBe(plaintext)
			})

			it("should handle empty encrypted strings", async () => {
				// Arrange
				const plaintext = ""
				const keyName: DeterministicEncryptionKeys = "EMAIL_ENCRYPTION_KEY"

				// Act
				const encrypted = await encryptor.deterministicEncrypt(plaintext, keyName)
				const decrypted = await encryptor.deterministicDecrypt(encrypted, keyName)

				// Assert
				expect(decrypted).toBe(plaintext)
			})

			it("should throw error for invalid encrypted data", async () => {
				// Arrange
				const invalidEncrypted = "invalid-base64-data" as DeterministicEncryptedString
				const keyName: DeterministicEncryptionKeys = "EMAIL_ENCRYPTION_KEY"

				// Act & Assert
				await expect(encryptor.deterministicDecrypt(invalidEncrypted, keyName)).rejects.toThrow()
			})
		})

		describe("isDeterministicEncryptedString", () => {
			it("should validate base64 encrypted strings", () => {
				const validBase64 = "dGVzdEBleGFtcGxlLmNvbQ==" as DeterministicEncryptedString
				const invalidBase64 = "not-base64!@#"
				const emptyString = ""

				// Act & Assert
				expect(Encryptor.isDeterministicEncryptedString(validBase64)).toBe(true)
				expect(Encryptor.isDeterministicEncryptedString(invalidBase64)).toBe(false)
				expect(Encryptor.isDeterministicEncryptedString(emptyString)).toBe(true) // Empty string is valid base64
			})

			it("should handle various base64 padding scenarios", () => {
				// Arrange
				const noPadding = "dGVzdA"
				const onePadding = "dGVzdGE="
				const twoPadding = "dGVzdGFi"

				// Act & Assert
				expect(Encryptor.isDeterministicEncryptedString(noPadding)).toBe(false) // Invalid base64
				expect(Encryptor.isDeterministicEncryptedString(onePadding)).toBe(true)
				expect(Encryptor.isDeterministicEncryptedString(twoPadding)).toBe(true)
			})
		})
	})

	describe("Hash", () => {
		describe("hashCredentials", () => {
			it("should hash passwords with bcrypt", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const password = "testPassword123!"

				// Act
				const hashed = await Hash.hashCredentials(password)

				// Assert
				expect(hashed).toBeDefined()
				expect(typeof hashed).toBe("string")
				expect(hashed).not.toBe(password)
				expect(hashed.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
				expect(hashed.startsWith("$2")).toBe(true) // bcrypt format
			})

			it("should produce different hashes for same password (salt)", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const password = "testPassword123!"

				// Act
				const hash1 = await Hash.hashCredentials(password)
				const hash2 = await Hash.hashCredentials(password)

				// Assert
				expect(hash1).not.toBe(hash2) // Different salts should produce different hashes
			})

			it("should handle empty passwords", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const password = ""

				// Act
				const hashed = await Hash.hashCredentials(password)

				// Assert
				expect(hashed).toBeDefined()
				expect(typeof hashed).toBe("string")
			})

			it("should handle special characters in passwords", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const password = "test@#$%^&*()_+{}|:\"<>?[];,./`~"

				// Act
				const hashed = await Hash.hashCredentials(password)

				// Assert
				expect(hashed).toBeDefined()
				expect(typeof hashed).toBe("string")
			})
		})

		describe("checkPassword", () => {
			it("should validate correct passwords", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const password = "testPassword123!"
				const hashed = await Hash.hashCredentials(password)

				// Act
				const isValid = await Hash.checkPassword(password, hashed)

				// Assert
				expect(isValid).toBe(true)
			})

			it("should reject incorrect passwords", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const correctPassword = "testPassword123!"
				const wrongPassword = "wrongPassword123!"
				const hashed = await Hash.hashCredentials(correctPassword)

				// Act
				const isValid = await Hash.checkPassword(wrongPassword, hashed)

				// Assert
				expect(isValid).toBe(false)
			})

			it("should be case sensitive", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const password = "testPassword123!"
				const wrongCasePassword = "TestPassword123!"
				const hashed = await Hash.hashCredentials(password)

				// Act
				const isValid = await Hash.checkPassword(wrongCasePassword, hashed)

				// Assert
				expect(isValid).toBe(false)
			})

			it("should handle empty password validation", async () => {
				// Arrange
				const { default: Hash } = await import("../../../src/classes/hash")
				const password = ""
				const hashed = await Hash.hashCredentials(password)

				// Act
				const isValid = await Hash.checkPassword(password, hashed)

				// Assert
				expect(isValid).toBe(true)
			})
		})
	})
})
