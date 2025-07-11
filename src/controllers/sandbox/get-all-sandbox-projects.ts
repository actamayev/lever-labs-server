import { Request, Response } from "express"
import retrieveUserSandboxProjectData from "../../db-operations/read/sandbox_project/retrieve-user-sandbox-project-data"
import { ErrorResponse, SandboxProject } from "@bluedotrobots/common-ts"
export default async function getAllSandboxProjects(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req

		const sandboxProjects = await retrieveUserSandboxProjectData(userId)

		res.status(200).json({ sandboxProjects } as { sandboxProjects: SandboxProject[] })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve sandbox project" } satisfies ErrorResponse)
		return
	}
}
