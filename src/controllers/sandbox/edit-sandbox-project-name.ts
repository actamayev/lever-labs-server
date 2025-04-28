import { Response, Request } from "express"
import updateSandboxProjectName from "../../db-operations/write/sandbox-project/update-sandbox-project-name"
import { ErrorResponse , SuccessResponse} from "@bluedotrobots/common-ts"

export default async function editSandboxProjectName(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req
		const { projectName } = req.body as { projectName: string }

		await updateSandboxProjectName(sandboxProjectId, projectName)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project notes" } as ErrorResponse)
		return
	}
}
