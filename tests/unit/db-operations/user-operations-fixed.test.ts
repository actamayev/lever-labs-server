import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

// Simplified mock types for testing
type MockPrismaClient = {
  credentials: {
    findFirst: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  pip_uuid: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  classroom: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  classroom_teacher_map: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  $transaction: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
};

// Type for mock SecretsManager
type MockSecretsManagerInstance = {
  getSecret: jest.MockedFunction<(key: DeterministicEncryptionKeys) => Promise<string>>;
};

type MockSecretsManager = {
  getInstance: jest.MockedFunction<() => MockSecretsManagerInstance>;
};

describe("Database Operations - User Operations", () => {
	let mockPrismaClient: MockPrismaClient
	let mockGetPrismaClient: jest.MockedFunction<() => Promise<MockPrismaClient>>
	let mockSecretsManager: MockSecretsManager

	beforeEach(() => {
		// Reset modules to ensure clean mocking
		jest.resetModules()

		mockPrismaClient = {
			credentials: {
				findFirst: jest.fn(),
			},
			pip_uuid: {
				create: jest.fn(),
			},
			classroom: {
				create: jest.fn(),
			},
			classroom_teacher_map: {
				create: jest.fn(),
			},
			$transaction: jest.fn(),
		}

		mockGetPrismaClient = jest.fn().mockImplementation(() => Promise.resolve(mockPrismaClient))

		mockSecretsManager = {
			getInstance: jest.fn().mockReturnValue({
				getSecret: jest.fn().mockImplementation((_key: DeterministicEncryptionKeys) => Promise.resolve("dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==")),
			}),
		}

		// Mock the modules
		jest.doMock("../../../src/classes/prisma-client", () => {
			return {
				__esModule: true,
				default: class MockPrismaClientClass {
					static getPrismaClient = mockGetPrismaClient
				},
			}
		})

		jest.doMock("../../../src/classes/aws/secrets-manager", () => {
			return {
				__esModule: true,
				default: class MockSecretsManager {
					static getInstance = jest.fn().mockReturnValue({
						getSecret: jest.fn().mockImplementation((_key: DeterministicEncryptionKeys) => Promise.resolve("dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==")),
					})
				},
			}
		})
	})

	describe("doesUsernameExist", () => {
		it("should return true when username exists", async () => {
			// Arrange
			const { default: doesUsernameExist } = await import("../../../src/db-operations/read/does-x-exist/does-username-exist")
			const username = "testuser"
			mockPrismaClient.credentials.findFirst.mockResolvedValue({ user_id: 1 })

			// Act
			const result = await doesUsernameExist(username)

			// Assert
			expect(result).toBe(true)
			expect(mockPrismaClient.credentials.findFirst).toHaveBeenCalledWith({
				where: {
					username: {
						equals: username,
						mode: "insensitive",
					},
				},
				select: {
					user_id: true,
				},
			})
		})

		it("should return false when username does not exist", async () => {
			// Arrange
			const { default: doesUsernameExist } = await import("../../../src/db-operations/read/does-x-exist/does-username-exist")
			const username = "nonexistentuser"
			mockPrismaClient.credentials.findFirst.mockResolvedValue(null)

			// Act
			const result = await doesUsernameExist(username)

			// Assert
			expect(result).toBe(false)
		})

		it("should handle database errors gracefully", async () => {
			// Arrange
			const { default: doesUsernameExist } = await import("../../../src/db-operations/read/does-x-exist/does-username-exist")
			const username = "testuser"
			const dbError = new Error("Database connection failed")
			mockPrismaClient.credentials.findFirst.mockRejectedValue(dbError)

			// Act & Assert
			await expect(doesUsernameExist(username)).rejects.toThrow("Database connection failed")
		})
	})

	describe("addPipUUIDRecord", () => {
		it("should successfully add a new PIP UUID record", async () => {
			// Arrange
			const { default: addPipUUIDRecord } = await import("../../../src/db-operations/write/pip-uuid/add-pip-uuid-record")
			const uuid = "test-uuid-123" as PipUUID
			mockPrismaClient.pip_uuid.create.mockResolvedValue({ uuid, hardware_version: "1.0.0" })

			// Act
			const result = await addPipUUIDRecord(uuid)

			// Assert
			expect(result).toBe(true)
			expect(mockPrismaClient.pip_uuid.create).toHaveBeenCalledWith({
				data: {
					uuid,
					hardware_version: "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==",
				},
			})
		})

		it("should return false on unique constraint violation (P2002)", async () => {
			// Arrange
			const { default: addPipUUIDRecord } = await import("../../../src/db-operations/write/pip-uuid/add-pip-uuid-record")
			const uuid = "duplicate-uuid-123" as PipUUID
			const prismaError = new PrismaClientKnownRequestError("Unique constraint failed", {
				code: "P2002",
				clientVersion: "5.0.0",
				meta: { target: ["uuid"] },
			})
			mockPrismaClient.pip_uuid.create.mockRejectedValue(prismaError)

			// Act
			const result = await addPipUUIDRecord(uuid)

			// Assert
			expect(result).toBe(false)
		})

		it("should rethrow non-P2002 errors", async () => {
			// Arrange
			const { default: addPipUUIDRecord } = await import("../../../src/db-operations/write/pip-uuid/add-pip-uuid-record")
			const uuid = "test-uuid-123" as PipUUID
			const otherError = new Error("Network error")
			mockPrismaClient.pip_uuid.create.mockRejectedValue(otherError)

			// Act & Assert
			await expect(addPipUUIDRecord(uuid)).rejects.toThrow("Network error")
		})
	})
})
