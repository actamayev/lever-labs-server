import { Request, Response } from "express"
import updateUsername from "../../db-operations/write/credentials/update-username"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function setUsername(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { username } = req.params
		await updateUsername(userId, username)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new username" } satisfies ErrorResponse)
		return
	}
}
