import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import findSandboxProjectIdFromUUID from "../../db-operations/read/find/find-sandbox-project-id-from-uuid"
import { ProjectUUID, ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"

export default async function attachSandboxProjectIdFromUUID(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: ProjectUUID }

		const sandboxProjectId = await findSandboxProjectIdFromUUID(projectUUID)

		if (isUndefined(sandboxProjectId)) {
			res.status(400).json({ message: "Sandbox Project ID doesn't exist" } satisfies MessageResponse)
			return
		}

		req.sandboxProjectId = sandboxProjectId

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to attach sandbox project Id from UUID" } satisfies ErrorResponse)
		return
	}
}
