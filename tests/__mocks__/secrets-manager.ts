import { jest } from "@jest/globals"

// Mock SecretsManager
export const mockSecretsManager = {
	getInstance: jest.fn().mockReturnValue({
		getSecret: jest.fn().mockImplementation((secretName: unknown) => {
			const mockSecrets: Record<string, string> = {
				"EMAIL_ENCRYPTION_KEY": "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==", // base64 encoded 32-byte key
				"JWT_SECRET": "test-jwt-secret-key",
				"GOOGLE_CLIENT_ID": "test-google-client-id",
				"PIP_HARDWARE_VERSION": "1.0.0",
			}
			return Promise.resolve(mockSecrets[secretName as string] || "mock-secret")
		}),
	}),
}

export default mockSecretsManager
