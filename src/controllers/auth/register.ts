import { Response, Request } from "express"
import { ErrorResponse, MessageResponse, RegisterRequest, RegisterSuccess } from "@actamayev/lever-labs-common-ts/types/api"
import Hash from "../../classes/hash"
import Encryptor from "../../classes/encryptor"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import { addLocalUser } from "../../db-operations/write/credentials/add-user"
import doesEmailExist from "../../db-operations/read/does-x-exist/does-email-exist"
import doesUsernameExist from "../../db-operations/read/does-x-exist/does-username-exist"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-history-record"
import constructLocalUserFields from "../../utils/auth-helpers/register/construct-local-user-fields"
import { setAuthCookie } from "../../middleware/cookie-helpers"

export default async function register(req: Request, res: Response): Promise<void> {
	try {
		const registerInformation = req.body.registerInformation as RegisterRequest

		const encryptor = new Encryptor()
		const encryptedEmail = await encryptor.deterministicEncrypt(registerInformation.email, "EMAIL_ENCRYPTION_KEY")
		const emailExists = await doesEmailExist(encryptedEmail)
		if (emailExists === true) {
			res.status(400).json({ message: "Email already taken" } satisfies MessageResponse)
			return
		}

		const usernameExists = await doesUsernameExist(registerInformation.username)
		if (usernameExists === true) {
			res.status(400).json({ message: "Username already taken" } satisfies MessageResponse)
			return
		}

		const hashedPassword = await Hash.hashCredentials(registerInformation.password)

		const userData = await constructLocalUserFields(registerInformation, hashedPassword)

		const userId = await addLocalUser(userData)

		const accessToken = await signJWT({
			userId,
			username: registerInformation.username,
			isActive: true
		})

		setAuthCookie(res, accessToken)
		res.status(200).json({ success: true } satisfies RegisterSuccess)
		void addLoginHistoryRecord(userId)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Register New User" } satisfies ErrorResponse)
		return
	}
}
