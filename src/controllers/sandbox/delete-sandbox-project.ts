import { Response, Request } from "express"
import markSandboxProjectInactive from "../../db-operations/write/sandbox-project/mark-sandbox-project-inactive"
import { ErrorResponse, SuccessResponse} from "@actamayev/lever-labs-common-ts/types/api"
import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"

export default async function deleteSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }

		await markSandboxProjectInactive(projectUUID)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete sandbox project" } satisfies ErrorResponse)
		return
	}
}
