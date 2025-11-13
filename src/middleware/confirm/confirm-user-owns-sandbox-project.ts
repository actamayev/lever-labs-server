import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import retrieveUserIdFromSandboxProjectUUID from "../../db-operations/read/sandbox_project/retrieve-user-id-from-sandbox-project-id"
import { ErrorResponse, MessageResponse } from "@lever-labs/common-ts/types/api"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"

export default async function confirmUserOwnsSandboxProject(
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

		if (userId !== foundOwnerId) {
			res.status(400).json({ message: "You do not own this sandbox project" } satisfies MessageResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to confirm user owns sandbox project"
		} satisfies ErrorResponse)
		return
	}
}

