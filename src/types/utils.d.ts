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

	type ECSKeys =
		"ECS_CLUSTER" |
		"ECS_TASK_DEFINITION" |
		"ECS_SUBNET" |
		"ECS_SECURITY_GROUP"

	type S3Keys =
		"COMPILED_BINARY_OUTPUT_BUCKET"

	type SecretKeys =
		EncryptionKeys |
		ECSKeys |
		S3Keys |
		"AWS_ACCESS_KEY_ID" |
		"AWS_SECRET_ACCESS_KEY" |
		"DATABASE_URL" |
		"JWT_KEY" |
		"GOOGLE_CLIENT_ID" |
		"GOOGLE_CLIENT_SECRET" |
		"PIP_HARDWARE_VERSION"

	type SecretsObject = { [K in SecretKeys]: string }

	type PipUUID = string & { readonly __brand: unique symbol }

	interface ECSConfig {
		cluster: string
		taskDefinition: string
		subnet: string
		securityGroup: string
		compiledBinaryOutputBucket: string
	}

	type CompilerEnvironment = "staging" | "production" | undefined

}

export {}
