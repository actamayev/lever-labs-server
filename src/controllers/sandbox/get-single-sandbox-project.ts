import { Request, Response } from "express"
import retrieveSingleSandboxProjectData from "../../db-operations/read/sandbox_project/retrieve-single-sandbox-project-data"
import { ErrorResponse, SandboxProject } from "@bluedotrobots/common-ts"

export default async function getSingleSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req

		const sandboxProject = await retrieveSingleSandboxProjectData(sandboxProjectId)

		res.status(200).json({ sandboxProject } as { sandboxProject: SandboxProject })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve single sandbox project" } as ErrorResponse)
		return
	}
}
