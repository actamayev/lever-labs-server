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

		PIP_HARDWARE_VERSION: string
		PIO_CACHE_VOLUME: string

		// These aren't actualy used in local testing (process.env). They're only used in staging/prod
		// They're here in case I want to simulate my environment as staging or prod
		ECS_CLUSTER: string
		ECS_TASK_DEFINITION: string
		ECS_SUBNET: string
		ECS_SECURITY_GROUP: string
	}
}
