import { Request, Response } from "express"
import { SiteThemes } from "@prisma/client"
import { isNull, isUndefined } from "lodash"
import { BasicPersonalInfoResponse, ErrorResponse, GoogleAuthSuccess, MessageResponse,
	StudentClassroomData, TeacherData } from "@bluedotrobots/common-ts/types/api"
import Encryptor from "../../classes/encryptor"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import SecretsManager from "../../classes/aws/secrets-manager"
import { findUserById } from "../../db-operations/read/find/find-user"
import { addGoogleUser } from "../../db-operations/write/credentials/add-user"
import createGoogleAuthClient from "../../utils/google/create-google-auth-client"
import extractTeacherDataFromUserData from "../../utils/teacher/extract-teacher-data-from-user-data"
import retrieveUserIdByEmail from "../../db-operations/read/credentials/retrieve-user-id-by-email"
import retrieveStudentClasses from "../../db-operations/read/credentials/retrieve-student-classes"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-history-record"
import { setAuthCookie } from "../../middleware/cookie-helpers"
import autoConnectToPip from "../../utils/pip/auto-connect-to-pip"

// eslint-disable-next-line max-lines-per-function
export default async function googleLoginAuthCallback(req: Request, res: Response): Promise<void> {
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
			res.status(500).json({ error: "Unable to get payload" } satisfies ErrorResponse)
			return
		}
		if (isUndefined(payload.email)) {
			res.status(500).json({ error: "Unable to find user email from payload" } satisfies ErrorResponse)
			return
		}

		const encryptor = new Encryptor()
		const encryptedEmail = await encryptor.deterministicEncrypt(payload.email, "EMAIL_ENCRYPTION_KEY")
		let userId = await retrieveUserIdByEmail(encryptedEmail)
		let accessToken: string
		let isNewUser = false
		let personalInfo: BasicPersonalInfoResponse | undefined = undefined
		let studentClasses: StudentClassroomData[] = []
		let teacherData: TeacherData | null = null
		if (isUndefined(userId)) {
			res.status(500).json({ error: "Unable to login with this email. Account offline." } satisfies ErrorResponse)
			return
		} else if (isNull(userId)) {
			userId = await addGoogleUser(encryptedEmail, siteTheme as SiteThemes)
			accessToken = await signJWT({ userId, username: null, isActive: true })
			isNewUser = true
		} else {
			const credentialsResult = await findUserById(userId)
			if (isNull(credentialsResult)) {
				// eslint-disable-next-line max-len
				res.status(400).json({ message: `There is no Blue Dot Robots account associated with ${payload.email}. Please try again.` } satisfies MessageResponse)
				return
			}
			accessToken = await signJWT({ userId, username: credentialsResult.username as string, isActive: true })
			personalInfo = {
				username: credentialsResult.username as string,
				email: payload.email,
				defaultSiteTheme: credentialsResult.default_site_theme as SiteThemes,
				profilePictureUrl: credentialsResult.profile_picture?.image_url || null,
				sandboxNotesOpen: credentialsResult.sandbox_notes_open,
				name: credentialsResult.name,
			}
			teacherData = extractTeacherDataFromUserData(credentialsResult)
			studentClasses = await retrieveStudentClasses(userId)
		}

		setAuthCookie(res, accessToken)
		const autoConnectToPipResult = autoConnectToPip(userId)

		res.status(200).json({
			isNewUser,
			personalInfo,
			studentClasses,
			teacherData,
			autoConnectedPipUUID: autoConnectToPipResult.pipUUID
		} satisfies GoogleAuthSuccess)
		void addLoginHistoryRecord(userId)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Login with Google" } satisfies ErrorResponse)
		return
	}
}
