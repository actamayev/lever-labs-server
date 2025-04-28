declare global {
	type EmailOrUsername = "Email" | "Username"

	interface JwtPayload {
		userId: number
		newUser: boolean
	}

	type DeterministicEncryptionKeys =
		"EMAIL_ENCRYPTION_KEY"

	type EncryptionKeys = DeterministicEncryptionKeys
	// Non-deterministic keys aren't searchable (encrypting the same string yields different results| NonDeterministicEncryptionKeys

	type SecretKeys =
		| EncryptionKeys
		| "AWS_ACCESS_KEY_ID"
		| "AWS_SECRET_ACCESS_KEY"
		| "DATABASE_URL"
		| "JWT_KEY"
		| "GOOGLE_CLIENT_ID"
		| "GOOGLE_CLIENT_SECRET"
		| "PIP_HARDWARE_VERSION"
		| "BDR_S3_BUCKET"
		| "FIRMWARE_S3_BUCKET"

	type SecretsObject = { [K in SecretKeys]: string }
}

export {}
