import _ from "lodash"
import { Response, Request } from "express"
import doesUsernameExist from "../../db-operations/read/does-x-exist/does-username-exist"
import setUsername from "../../db-operations/write/credentials/set-username"

export default async function registerUsername (req: Request, res: Response): Promise<void> {
	try {
		const { user } = req
		if (!_.isNull(user.username)) {
			res.status(400).json({ message: "Username already registered" })
			return
		}
		const username = req.body.username as string
		const usernameExists = await doesUsernameExist(username)
		if (usernameExists === true) {
			res.status(400).json({ message: "Username taken" })
			return
		}

		await setUsername(user.user_id, username)

		res.status(200).json({ success: "Username registered" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Register username" })
		return
	}
}
