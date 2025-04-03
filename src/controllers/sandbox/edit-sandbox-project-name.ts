import { Response, Request } from "express"
import updateSandboxProjectName from "../../db-operations/write/sandbox-project/update-sandbox-project-name"

export default async function editSandboxProjectName(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req
		const { projectName } = req.body as { projectName: string }

		await updateSandboxProjectName(sandboxProjectId, projectName)

		res.status(200).json({ success: "" })
		return
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project notes" })
		return
	}
}
