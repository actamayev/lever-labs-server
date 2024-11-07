import { credentials, pip_uuid } from "@prisma/client"

declare global {
	type ExtendedCredentials = credentials & {
		email__encrypted: DeterministicEncryptedString | null

		password: HashedString | null
	}

	type ExtendedPipUUID = pip_uuid & {
		uuid: PipUUID
	}
}

export {}
