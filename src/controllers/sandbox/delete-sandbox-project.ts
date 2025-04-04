import { Response, Request } from "express"
import markSandboxProjectInactive from "../../db-operations/write/sandbox-project/mark-sandbox-project-inactive"

export default async function deleteSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req

		await markSandboxProjectInactive(sandboxProjectId)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete sandbox project" })
		return
	}
}
