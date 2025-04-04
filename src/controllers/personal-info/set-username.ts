import { Request, Response } from "express"
import updateUsername from "../../db-operations/write/credentials/update-username"

export default async function setUsername(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const username = req.params.username
		await updateUsername(userId, username)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new username" })
		return
	}
}
