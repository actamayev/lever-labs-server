import isNull from "lodash/isNull"
import { Response, Request } from "express"
import { ErrorResponse, LoginRequest, LoginSuccess, MessageResponse } from "@bluedotrobots/common-ts"
import Hash from "../../classes/hash"
import Encryptor from "../../classes/encryptor"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import determineLoginContactType from "../../utils/auth-helpers/determine-contact-type"
import extractTeacherDataFromUserData from "../../utils/extract-teacher-data-from-user-data"
import retrieveUserFromContact from "../../utils/auth-helpers/login/retrieve-user-from-contact"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-history-record"
import retrieveUserPipUUIDsDetails from "../../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids-details"
import retrieveStudentClasses from "../../db-operations/read/credentials/retrieve-student-classes"

// eslint-disable-next-line max-lines-per-function
export default async function login(req: Request, res: Response): Promise<void> {
	try {
		const { contact, password } = req.body.loginInformation as LoginRequest
		const loginContactType = determineLoginContactType(contact)

		const credentialsResult = await retrieveUserFromContact(contact, loginContactType)
		if (isNull(credentialsResult)) {
			res.status(400).json(
				{ message: `There is no Blue Dot Robots account associated with ${contact}. Please try again.` } satisfies MessageResponse
			)
			return
		}
		if (credentialsResult.auth_method === "google") {
			res.status(400).json({ message: "Please log in with Google" } satisfies MessageResponse)
			return
		}

		const doPasswordsMatch = await Hash.checkPassword(password, credentialsResult.password as HashedString)
		if (doPasswordsMatch === false) {
			res.status(400).json({ message: "Wrong password. Please try again." } satisfies MessageResponse)
			return
		}

		const accessToken = await signJWT({ userId: credentialsResult.user_id, newUser: false })

		const userPipData = await retrieveUserPipUUIDsDetails(credentialsResult.user_id)

		const encryptor = new Encryptor()
		const email = await encryptor.deterministicDecrypt(credentialsResult.email__encrypted, "EMAIL_ENCRYPTION_KEY")
		const studentClasses = await retrieveStudentClasses(credentialsResult.user_id)

		res.status(200).json({
			accessToken,
			personalInfo: {
				username: credentialsResult.username as string,
				email,
				defaultSiteTheme: credentialsResult.default_site_theme,
				profilePictureUrl: credentialsResult.profile_picture?.image_url || null,
				sandboxNotesOpen: credentialsResult.sandbox_notes_open,
				name: credentialsResult.name,
				teacherData: extractTeacherDataFromUserData(credentialsResult)
			},
			userPipData,
			studentClasses
		} satisfies LoginSuccess)
		void addLoginHistoryRecord(credentialsResult.user_id)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Login" } satisfies ErrorResponse)
		return
	}
}
