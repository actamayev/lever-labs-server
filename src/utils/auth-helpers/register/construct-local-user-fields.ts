import { RegisterRequest } from "@bluedotrobots/common-ts"
import Encryptor from "../../../classes/encryptor"

export default async function constructLocalUserFields(
	registerInformation: RegisterRequest,
	hashedPassword: HashedString
): Promise<NewLocalUserFields> {
	try {
		const encryptor = new Encryptor()
		const encryptedEmail = await encryptor.deterministicEncrypt(registerInformation.email, "EMAIL_ENCRYPTION_KEY")

		return {
			username: registerInformation.username,
			password: hashedPassword,
			auth_method: "blue_dot",
			default_site_theme: registerInformation.siteTheme,
			email__encrypted: encryptedEmail
		}
	} catch (error) {
		console.error("Error adding user", error)
		throw error
	}
}
