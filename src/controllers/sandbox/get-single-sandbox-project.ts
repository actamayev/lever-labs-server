import { Request, Response } from "express"
import retrieveSingleSandboxProjectData from "../../db-operations/read/sandbox_project/retrieve-single-sandbox-project-data"

export default async function getSingleSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: ProjectUUID }

		const sandboxProject = await retrieveSingleSandboxProjectData(projectUUID)

		res.status(200).json({ sandboxProject })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve single sandbox project" })
		return
	}
}
