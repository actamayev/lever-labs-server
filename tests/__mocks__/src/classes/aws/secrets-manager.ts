import { jest } from "@jest/globals"

// Mock SecretsManager
export const mockSecretsManager = {
	getInstance: jest.fn().mockReturnValue({
		getSecret: jest.fn().mockImplementation((key: unknown) => {
			const secretKey = key as SecretKeys
			const secrets: Record<SecretKeys, string> = {
				"JWT_KEY": "test-jwt-secret-key",
				"GOOGLE_CLIENT_ID": "test-google-client-id",
				"GOOGLE_CLIENT_SECRET": "test-google-client-secret",
				"EMAIL_ENCRYPTION_KEY": "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==",
				"LEVER_LABS_S3_BUCKET": "test-bdr-s3-bucket",
				"FIRMWARE_S3_BUCKET": "test-firmware-s3-bucket",
				"DATABASE_URL": "test-database-url",
				"AWS_ACCESS_KEY_ID": "test-aws-access-key-id",
				"AWS_SECRET_ACCESS_KEY": "test-aws-secret-access-key",
				"OPENROUTER_API_KEY": "test-openrouter-api-key",
				"PIP_HARDWARE_VERSION": "1.0.0",
				"REDIS_HOST": "localhost",
				"REDIS_PORT": "6379",
				"REDIS_PASSWORD": "test-redis-password",
				"MONGODB_URL": "test-mongodb-url",
			}
			return Promise.resolve(secrets[secretKey] || "mock-secret")
		})
	})
}

export default mockSecretsManager
