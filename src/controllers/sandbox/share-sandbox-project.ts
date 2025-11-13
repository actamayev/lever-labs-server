import { Response, Request } from "express"
import upsertSandboxProjectShare from "../../db-operations/write/sandbox-project-shares/upsert-sandbox-project-share"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"

export default async function shareSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }
		const { userIdSharedWith } = req.body as { userIdSharedWith: number }

		await upsertSandboxProjectShare(projectUUID, userIdSharedWith)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to share sandbox project"
		} satisfies ErrorResponse)
		return
	}
}

