import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import retrieveUserIdFromSandboxProjectUUID from "../../db-operations/read/sandbox_project/retrieve-user-id-from-sandbox-project-id"
import { ErrorResponse, MessageResponse } from "@lever-labs/common-ts/types/api"

export default async function confirmSandboxProjectExistsAndValidUserId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId, sandboxProjectId } = req

		const foundOwnerId = await retrieveUserIdFromSandboxProjectUUID(sandboxProjectId)

		if (isUndefined(foundOwnerId)) {
			res.status(400).json({ message: "Sandbox UUID doesn't exist" } satisfies MessageResponse)
			return
		}

		if (userId !== foundOwnerId) {
			res.status(400).json({ message: "This sandbox project is associated with another user" } satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to confirm sandbox project exists and valid userId"
		} satisfies ErrorResponse)
		return
	}
}
