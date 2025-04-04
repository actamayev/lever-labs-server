import { Response, Request } from "express"
import updateSandboxProjectNotes from "../../db-operations/write/sandbox-project/update-sandbox-project-notes"

export default async function editSandboxProjectNotes(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req
		const { projectNotes } = req.body as { projectNotes: string }

		await updateSandboxProjectNotes(sandboxProjectId, projectNotes)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project name" })
		return
	}
}
