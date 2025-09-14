import { jest } from "@jest/globals"

// Simplified mock types for testing - avoids complex Prisma generics
type MockPrismaClient = {
  credentials: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    findFirst: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    findUnique: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    update: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    delete: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  pip_uuid: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    findFirst: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    findUnique: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  sandbox_project: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    findFirst: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    update: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  classroom: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    findFirst: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  classroom_teacher_map: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  login_history: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  sandbox_message: {
    create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
  $transaction: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  $connect: jest.MockedFunction<() => Promise<void>>;
  $disconnect: jest.MockedFunction<() => Promise<void>>;
};

// Mock PrismaClient
export const mockPrismaClient: MockPrismaClient = {
	credentials: {
		create: jest.fn(),
		findFirst: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	pip_uuid: {
		create: jest.fn(),
		findFirst: jest.fn(),
		findUnique: jest.fn(),
	},
	sandbox_project: {
		create: jest.fn(),
		findFirst: jest.fn(),
		update: jest.fn(),
	},
	classroom: {
		create: jest.fn(),
		findFirst: jest.fn(),
	},
	classroom_teacher_map: {
		create: jest.fn(),
	},
	login_history: {
		create: jest.fn(),
	},
	sandbox_message: {
		create: jest.fn(),
	},
	$transaction: jest.fn(),
	$connect: jest.fn(),
	$disconnect: jest.fn(),
}

// Mock the PrismaClientClass
export const mockGetPrismaClient = jest.fn().mockImplementation(() => Promise.resolve(mockPrismaClient))

const mockPrismaClientClass = {
	getPrismaClient: mockGetPrismaClient,
}

export default mockPrismaClientClass
