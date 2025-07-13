import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"
import retrieveUserIdByUsername from "../../db-operations/read/credentials/retrieve-user-id-by-username"

// confirmUsernameExists
export default async function attachStudentUserId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { username } = req.body as { username: string }

		const studentUserId = await retrieveUserIdByUsername(username)

		if (isUndefined(studentUserId)) {
			res.status(400).json({ message: "This username does not exist" } satisfies MessageResponse)
			return
		}
		req.studentUserId = studentUserId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm if username exists" } satisfies ErrorResponse)
		return
	}
}
