import { credentials } from "@prisma/client"
import Encryptor from "../../classes/encryptor"

export function validateExtendedCredentials(data: credentials): data is ExtendedCredentials {
	try {
		return Encryptor.isDeterministicEncryptedString(data.email__encrypted)
	} catch (error) {
		console.error(error)
		throw error
	}
}
