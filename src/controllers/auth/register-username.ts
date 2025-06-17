import isNull from "lodash/isNull"
import { Response, Request } from "express"
import { ErrorResponse, MessageResponse, EmailUpdatesRequest } from "@bluedotrobots/common-ts"
import Encryptor from "../../classes/encryptor"
import setUsername from "../../db-operations/write/credentials/set-username"
import doesUsernameExist from "../../db-operations/read/does-x-exist/does-username-exist"

export default async function registerUsername (req: Request, res: Response): Promise<void> {
	try {
		const { user } = req
		if (!isNull(user.username)) {
			res.status(400).json({ message: "You've already registered a username for this account" } as MessageResponse)
			return
		}
		const username = req.body.username as string
		const usernameExists = await doesUsernameExist(username)
		if (usernameExists === true) {
			res.status(400).json({ message: "Username already taken" } as MessageResponse)
			return
		}

		await setUsername(user.user_id, username)
		const encryptor = new Encryptor()
		const email = await encryptor.deterministicDecrypt(user.email__encrypted, "EMAIL_ENCRYPTION_KEY")

		// We're returning the email in the response for the client to update their UI
		res.status(200).json({ email } as EmailUpdatesRequest)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to register username" } as ErrorResponse)
		return
	}
}
