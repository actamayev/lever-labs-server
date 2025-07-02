// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars
declare namespace NodeJS {
	interface ProcessEnv {
		// JWT:
		JWT_KEY: string

		// Google Auth:
		GOOGLE_CLIENT_ID: string
		GOOGLE_CLIENT_SECRET: string

		// Encryption:
		EMAIL_ENCRYPTION_KEY: DeterministicEncryptionKeys

		BDR_S3_BUCKET: string
		FIRMWARE_S3_BUCKET: string

		// Production only:
		DATABASE_URL: string
		AWS_ACCESS_KEY_ID: string
		AWS_SECRET_ACCESS_KEY: string

		NODE_ENV: "staging" | "production" | undefined

		PIP_HARDWARE_VERSION: string
	}
}
