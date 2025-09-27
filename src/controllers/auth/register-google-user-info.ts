import isNull from "lodash/isNull"
import { Response, Request } from "express"
import { ErrorResponse, MessageResponse, EmailUpdatesRequest, NewGoogleInfoRequest } from "@lever-labs/common-ts/types/api"
import Encryptor from "../../classes/encryptor"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import { setAuthCookie } from "../../middleware/cookie-helpers"
import doesUsernameExist from "../../db-operations/read/does-x-exist/does-username-exist"
import setUsernameAndAge from "../../db-operations/write/credentials/set-username-and-age"

export default async function registerGoogleInfo(req: Request, res: Response): Promise<void> {
	try {
		const { user } = req
		if (!isNull(user.username)) {
			res.status(400).json({ message: "You've already registered a username for this account" } satisfies MessageResponse)
			return
		}
		const googleData = req.body as NewGoogleInfoRequest
		const usernameExists = await doesUsernameExist(googleData.username)
		if (usernameExists === true) {
			res.status(400).json({ message: "Username already taken" } satisfies MessageResponse)
			return
		}

		await setUsernameAndAge(user.user_id, googleData)
		const newAccessToken = await signJWT({
			userId: user.user_id,
			username: googleData.username,  // Now has the username!
			isActive: true
		})

		// ✅ ADD: Update the cookie with new JWT
		setAuthCookie(res, newAccessToken)

		const encryptor = new Encryptor()
		const email = await encryptor.deterministicDecrypt(user.email__encrypted, "EMAIL_ENCRYPTION_KEY")

		res.status(200).json({ email } satisfies EmailUpdatesRequest)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to register username" } satisfies ErrorResponse)
		return
	}
}
