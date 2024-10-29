import { credentials } from "@prisma/client"

declare global {
	type ExtendedCredentials = credentials & {
		email__encrypted: DeterministicEncryptedString | null

		password: HashedString | null
	}
}

export {}
