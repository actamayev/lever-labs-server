import { Request, Response } from "express"
import { ErrorResponse, RetrieveSandboxProjectResponse } from "@lever-labs/common-ts/types/api"
import retrieveSingleSandboxProjectData from "../../db-operations/read/sandbox_project/retrieve-single-sandbox-project-data"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"

export default async function getSingleSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }

		const sandboxProject = await retrieveSingleSandboxProjectData(projectUUID, userId)

		res.status(200).json({ sandboxProject } satisfies RetrieveSandboxProjectResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve single sandbox project" } satisfies ErrorResponse)
		return
	}
}
