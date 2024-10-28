import { OAuth2Client } from "google-auth-library"
import SecretsManager from "../../classes/secrets-manager"

export default async function createGoogleAuthClient(): Promise<OAuth2Client> {
	try {
		const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = await SecretsManager.getInstance().getSecrets(
			["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]
		)

		return new OAuth2Client(
			GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET,
			"postmessage"
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}
