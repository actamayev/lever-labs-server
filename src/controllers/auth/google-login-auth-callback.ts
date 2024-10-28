import _ from "lodash"
import { Request, Response } from "express"
import { SiteThemes } from "@prisma/client"
import Encryptor from "../../classes/encryptor"
import SecretsManager from "../../classes/secrets-manager"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import { addGoogleUser } from "../../db-operations/write/credentials/add-user"
import createGoogleAuthClient from "../../utils/google/create-google-auth-client"
import retrieveUserIdByEmail from "../../db-operations/read/credentials/retrieve-user-id-by-email"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-hisory-record"

// eslint-disable-next-line max-lines-per-function
export default async function googleLoginAuthCallback (req: Request, res: Response): Promise<void> {
	try {
		const { idToken, siteTheme } = req.body
		const client = await createGoogleAuthClient()
		const googleClientId = await SecretsManager.getInstance().getSecret("GOOGLE_CLIENT_ID")
		const ticket = await client.verifyIdToken({
			idToken,
			audience: googleClientId
		})
		const payload = ticket.getPayload()
		if (_.isUndefined(payload)) {
			res.status(500).json({ error: "Unable to get payload" })
			return
		}
		if (_.isUndefined(payload.email)) {
			res.status(500).json({ error: "Unable to find user email from payload" })
			return
		}

		const encryptor = new Encryptor()
		const encryptedEmail = await encryptor.deterministicEncrypt(payload.email, "EMAIL_ENCRYPTION_KEY")
		let userId = await retrieveUserIdByEmail(encryptedEmail)
		let accessToken: string
		let isNewUser = false

		if (_.isUndefined(userId)) {
			res.status(500).json({ error: "Unable to login with this email. Account inactive." })
			return
		} else if (!_.isNull(userId)) {
			accessToken = await signJWT({ userId, newUser: false })
			return
		} else {
			userId = await addGoogleUser(encryptedEmail, siteTheme as SiteThemes)
			accessToken = await signJWT({ userId, newUser: true })
			isNewUser = true
		}

		await addLoginHistoryRecord(userId)

		res.status(200).json({ accessToken, isNewUser })
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Login with Google" })
	}
}
