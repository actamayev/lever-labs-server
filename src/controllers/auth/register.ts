import { Response, Request } from "express"
import Hash from "../../classes/hash"
import Encryptor from "../../classes/encryptor"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import { addLocalUser } from "../../db-operations/write/credentials/add-user"
import doesEmailExist from "../../db-operations/read/does-x-exist/does-email-exist"
import doesUsernameExist from "../../db-operations/read/does-x-exist/does-username-exist"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-hisory-record"
import constructLocalUserFields from "../../utils/auth-helpers/register/construct-local-user-fields"

export default async function register (req: Request, res: Response): Promise<void> {
	try {
		const registerInformation = req.body.registerInformation as RegisterInformation

		const encryptor = new Encryptor()
		const encryptedEmail = await encryptor.deterministicEncrypt(registerInformation.email, "EMAIL_ENCRYPTION_KEY")
		const emailExists = await doesEmailExist(encryptedEmail)
		if (emailExists === true) {
			res.status(400).json({ message: "Email already exists" })
			return
		}

		const usernameExists = await doesUsernameExist(registerInformation.username)
		if (usernameExists === true) {
			res.status(400).json({ message: "Username taken" })
			return
		}

		const hashedPassword = await Hash.hashCredentials(registerInformation.password)

		const userData = await constructLocalUserFields(registerInformation, hashedPassword)

		const userId = await addLocalUser(userData)

		await addLoginHistoryRecord(userId)

		const accessToken = await signJWT({ userId, newUser: true })

		res.status(200).json({ accessToken })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Register New User" })
		return
	}
}
