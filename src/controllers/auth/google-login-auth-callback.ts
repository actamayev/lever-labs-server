import { Request, Response } from "express"
import { SiteThemes } from "@prisma/client"
import { isNull, isUndefined } from "lodash"
import { ErrorResponse, GoogleAuthSuccess, MessageResponse, PersonalInfoResponse, PipData } from "@bluedotrobots/common-ts"
import Encryptor from "../../classes/encryptor"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import SecretsManager from "../../classes/aws/secrets-manager"
import { findUserById } from "../../db-operations/read/find/find-user"
import { addGoogleUser } from "../../db-operations/write/credentials/add-user"
import createGoogleAuthClient from "../../utils/google/create-google-auth-client"
import retrieveUserIdByEmail from "../../db-operations/read/credentials/retrieve-user-id-by-email"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-history-record"
import retrieveUserPipUUIDsDetails from "../../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids-details"

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
		let personalInfo: PersonalInfoResponse | undefined = undefined
		if (isUndefined(userId)) {
			res.status(500).json({ error: "Unable to login with this email. Account offline." } as ErrorResponse)
			return
		} else if (isNull(userId)) {
			userId = await addGoogleUser(encryptedEmail, siteTheme as SiteThemes)
			accessToken = await signJWT({ userId, newUser: true })
			isNewUser = true
		} else {
			accessToken = await signJWT({ userId, newUser: false })
			userPipData = await retrieveUserPipUUIDsDetails(userId)
			const credentialsResult = await findUserById(userId)
			if (isNull(credentialsResult)) {
				// eslint-disable-next-line max-len
				res.status(400).json({ message: `There is no Blue Dot Robots account associated with ${payload.email}. Please try again.` } as MessageResponse)
				return
			}
			personalInfo = {
				username: credentialsResult.username as string,
				email: payload.email,
				defaultSiteTheme: credentialsResult.default_site_theme as SiteThemes,
				profilePictureUrl: credentialsResult.profile_picture?.image_url || null,
				sandboxNotesOpen: credentialsResult.sandbox_notes_open,
				name: credentialsResult.name
			}
		}

		await addLoginHistoryRecord(userId)

		res.status(200).json({
			accessToken,
			isNewUser,
			personalInfo,
			userPipData
		} as GoogleAuthSuccess)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Login with Google" } as ErrorResponse)
		return
	}
}
