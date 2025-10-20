import { Response, Request } from "express"
import updateSandboxStarStatus from "../../db-operations/write/sandbox-project/update-sandbox-project-star-status"
import { ErrorResponse, SuccessResponse} from "@lever-labs/common-ts/types/api"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"

export default async function starSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }
		const { starStatus } = req.body as { starStatus: boolean }

		await updateSandboxStarStatus(projectUUID, starStatus)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox star status" } satisfies ErrorResponse)
		return
	}
}
