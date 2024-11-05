import { credentials, pip_uuid } from "@prisma/client"
import isPipUUID from "./type-checks"
import Encryptor from "../classes/encryptor"

export function validateExtendedCredentials(data: credentials): data is ExtendedCredentials {
	try {
		return Encryptor.isDeterministicEncryptedString(data.email__encrypted)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export function validateExtendedPipUUID(data: pip_uuid): data is ExtendedPipUUID {
	try {
		return isPipUUID(data.uuid)
	} catch (error) {
		console.error(error)
		throw error
	}
}
