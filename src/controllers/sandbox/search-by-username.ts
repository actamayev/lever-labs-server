import { Response, Request } from "express"
import { ErrorResponse, SearchByUsernameResult } from "@lever-labs/common-ts/types/api"
import searchUsersByUsername from "../../db-operations/read/credentials/search-users-by-username"

export default async function searchByUsername(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { username } = req.body as { username: string }

		const users = await searchUsersByUsername(username, userId)

		res.status(200).json({ users } satisfies SearchByUsernameResult)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to search users by username" } satisfies ErrorResponse)
		return
	}
}

