import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import retrieveUserIdFromSandboxProjectUUID from "../../db-operations/read/sandbox_project/retrieve-user-id-from-sandbox-project-id"
import checkSandboxProjectShareExists from "../../db-operations/read/sandbox-project-shares/check-sandbox-project-share-exists"
import { ErrorResponse, MessageResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"

export default async function confirmSandboxProjectExistsAndUserHasAccess(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId } = req
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }

		const foundOwnerId = await retrieveUserIdFromSandboxProjectUUID(projectUUID)

		if (isUndefined(foundOwnerId)) {
			res.status(400).json({ message: "Sandbox UUID doesn't exist" } satisfies MessageResponse)
			return
		}

		// Check if user is the owner
		if (userId === foundOwnerId) {
			next()
			return
		}

		// Check if user is a shared user
		const isSharedUser = await checkSandboxProjectShareExists(projectUUID, userId)

		if (isSharedUser) {
			next()
			return
		}

		// User is neither owner nor shared user
		res.status(400).json({ message: "You do not have access to this sandbox project" } satisfies MessageResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to confirm sandbox project access"
		} satisfies ErrorResponse)
		return
	}
}

