import { Request, Response, NextFunction } from "express"
import doesUsernameExist from "../../db-operations/read/does-x-exist/does-username-exist"

export default async function confirmUsernameNotTaken(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { username } = req.params as { username: string }

		const usernameExists = await doesUsernameExist(username)

		if (usernameExists) {
			res.status(400).json({ message: "This username is taken"})
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm if this username is already taken" })
		return
	}
}
