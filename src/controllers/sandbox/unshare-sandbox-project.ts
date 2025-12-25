import { Response, Request } from "express"
import removeSandboxProjectShare from "../../db-operations/write/sandbox-project-shares/remove-sandbox-project-share"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"

export default async function unshareSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }
		const { userIdToUnshareWith } = req.body as { userIdToUnshareWith: number }

		await removeSandboxProjectShare(projectUUID, userIdToUnshareWith)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to unshare sandbox project" } satisfies ErrorResponse)
		return
	}
}

