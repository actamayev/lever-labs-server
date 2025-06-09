import { Request, Response } from "express"
import { SiteThemes } from "@prisma/client"
import { isNull, isUndefined } from "lodash"
import Encryptor from "../../classes/encryptor"
import SecretsManager from "../../classes/aws/secrets-manager"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import { addGoogleUser } from "../../db-operations/write/credentials/add-user"
import createGoogleAuthClient from "../../utils/google/create-google-auth-client"
import retrieveUserIdByEmail from "../../db-operations/read/credentials/retrieve-user-id-by-email"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-history-record"
import retrieveUserPipUUIDsDetails from "../../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids-details"
import { ErrorResponse, GoogleAuthSuccess, PipData } from "@bluedotrobots/common-ts"

// eslint-disable-next-line max-lines-per-function
export default async function googleLoginAuthCallback (req: Request, res: Response): Promise<void> {
	try {
		const { idToken, siteTheme } = req.body
		// TODO 6/9/25: Should we get the user's age when they login with Google?
		const client = await createGoogleAuthClient()
		const googleClientId = await SecretsManager.getInstance().getSecret("GOOGLE_CLIENT_ID")
		const ticket = await client.verifyIdToken({
			idToken,
			audience: googleClientId
		})
		const payload = ticket.getPayload()
		if (isUndefined(payload)) {
			res.status(500).json({ error: "Unable to get payload" } as ErrorResponse)
			return
		}
		if (isUndefined(payload.email)) {
			res.status(500).json({ error: "Unable to find user email from payload" } as ErrorResponse)
			return
		}

		const encryptor = new Encryptor()
		const encryptedEmail = await encryptor.deterministicEncrypt(payload.email, "EMAIL_ENCRYPTION_KEY")
		let userId = await retrieveUserIdByEmail(encryptedEmail)
		let accessToken: string
		let isNewUser = false
		let userPipData: PipData[] = []

		if (isUndefined(userId)) {
			res.status(500).json({ error: "Unable to login with this email. Account offline." } as ErrorResponse)
			return
		} else if (!isNull(userId)) {
			accessToken = await signJWT({ userId, newUser: false })
			userPipData = await retrieveUserPipUUIDsDetails(userId)
		} else {
			userId = await addGoogleUser(encryptedEmail, siteTheme as SiteThemes)
			accessToken = await signJWT({ userId, newUser: true })
			isNewUser = true
		}

		await addLoginHistoryRecord(userId)

		res.status(200).json({ accessToken, isNewUser, userPipData } as GoogleAuthSuccess)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Login with Google" } as ErrorResponse)
		return
	}
}
