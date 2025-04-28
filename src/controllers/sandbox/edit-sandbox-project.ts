import { Response, Request } from "express"
import updateSandboxProject from "../../db-operations/write/sandbox-project/update-sandbox-project"
import { ErrorResponse , SuccessResponse} from "@bluedotrobots/common-ts"
export default async function editSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req
		const { newXml } = req.body as { newXml: string }

		await updateSandboxProject(sandboxProjectId, newXml)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project" } as ErrorResponse)
		return
	}
}
