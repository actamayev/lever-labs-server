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
		EncryptionKeys |
		"AWS_ACCESS_KEY_ID" |
		"AWS_SECRET_ACCESS_KEY" |
		"DATABASE_URL" |
		"JWT_KEY" |
		"PUBLIC_S3_BUCKET" |
		"PRIVATE_S3_BUCKET" |
		"FORTUNA_FEE_PAYER_SECRET_KEY" |
		"FORTUNA_FEE_PAYER_WALLET_ID_DB" |
		"GOOGLE_CLIENT_ID" |
		"GOOGLE_CLIENT_SECRET"

	type SecretsObject = { [K in SecretKeys]: string }

	type PipUUID = string & { readonly __brand: unique symbol };
}

export {}
