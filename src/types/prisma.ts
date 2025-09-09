import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { credentials, pip_uuid } from "@prisma/client"

declare global {
	type ExtendedCredentials = credentials & {
		email__encrypted: DeterministicEncryptedString | null

		password: HashedString | null
		profile_picture: {
			image_url: string
		} | null
		teacher: {
			teacher_first_name: string
			teacher_last_name: string
			is_approved: boolean | null
			school: {
				school_name: string
			}
		} | null
	}

	type ExtendedPipUUID = pip_uuid & {
		uuid: PipUUID
	}
}

export {}
