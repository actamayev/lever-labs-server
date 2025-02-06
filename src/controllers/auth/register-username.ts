import _ from "lodash"
import { Response, Request } from "express"
import setUsername from "../../db-operations/write/credentials/set-username"
import doesUsernameExist from "../../db-operations/read/does-x-exist/does-username-exist"

export default async function registerUsername (req: Request, res: Response): Promise<void> {
	try {
		const { user } = req
		if (!_.isNull(user.username)) {
			res.status(400).json({ message: "You've already registered a username for this account" })
			return
		}
		const username = req.body.username as string
		const usernameExists = await doesUsernameExist(username)
		if (usernameExists === true) {
			res.status(400).json({ message: "Username already taken" })
			return
		}

		await setUsername(user.user_id, username)

		res.status(200).json({ success: "Username registered" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to register username" })
		return
	}
}
