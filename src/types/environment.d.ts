declare namespace NodeJS {
	interface ProcessEnv {
		// JWT:
		JWT_KEY: string

		// Google Auth:
		GOOGLE_CLIENT_ID: string
		GOOGLE_CLIENT_SECRET: string

		// Encryption:
		EMAIL_ENCRYPTION_KEY: DeterministicEncryptionKeys

		// Production only:
		DATABASE_URL: string
		AWS_ACCESS_KEY_ID: string
		AWS_SECRET_ACCESS_KEY: string

		NODE_ENV: "local" | "staging" | "production"
	}
}
