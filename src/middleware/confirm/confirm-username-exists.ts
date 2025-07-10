import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"
import retrieveUserIdByUsername from "../../db-operations/read/credentials/retrieve-user-id-by-username"

export default async function confirmUsernameExists(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { username } = req.body as { username: string }

		const studentId = await retrieveUserIdByUsername(username)

		if (isUndefined(studentId)) {
			res.status(400).json({ message: "This username does not exist" } as MessageResponse)
			return
		}
		req.studentId = studentId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm if username exists" } as ErrorResponse)
		return
	}
}
