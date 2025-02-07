import isNull from "lodash/isNull"
import { Response, Request } from "express"
import Hash from "../../classes/hash"
import signJWT from "../../utils/auth-helpers/jwt/sign-jwt"
import determineLoginContactType from "../../utils/auth-helpers/determine-contact-type"
import retrieveUserFromContact from "../../utils/auth-helpers/login/retrieve-user-from-contact"
import addLoginHistoryRecord from "../../db-operations/write/login-history/add-login-hisory-record"
import retrieveUserPipUUIDsDetails from "../../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids-details"

export default async function login (req: Request, res: Response): Promise<void> {
	try {
		const { contact, password } = req.body.loginInformation as LoginInformation
		const loginContactType = determineLoginContactType(contact)

		const credentialsResult = await retrieveUserFromContact(contact, loginContactType)
		if (isNull(credentialsResult)) {
			res.status(400).json({ message: `There is no Blue Dot Robots account associated with ${contact}. Please try again.` })
			return
		}
		if (credentialsResult.auth_method === "google") {
			res.status(400).json({ message: "Please log in with Google" })
			return
		}

		const doPasswordsMatch = await Hash.checkPassword(password, credentialsResult.password as HashedString)
		if (doPasswordsMatch === false) {
			res.status(400).json({ message: "Wrong password. Please try again." })
			return
		}

		const accessToken = await signJWT({ userId: credentialsResult.user_id, newUser: false })

		await addLoginHistoryRecord(credentialsResult.user_id)

		const userPipData = await retrieveUserPipUUIDsDetails(credentialsResult.user_id)

		res.status(200).json({ accessToken, userPipData })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Login" })
		return
	}
}
