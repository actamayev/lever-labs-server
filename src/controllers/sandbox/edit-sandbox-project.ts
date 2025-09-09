import { Response, Request } from "express"
import updateSandboxProject from "../../db-operations/write/sandbox-project/update-sandbox-project"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts/types/api"
import { BlocklyJson } from "@bluedotrobots/common-ts/types/sandbox"

export default async function editSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req
		const { newBlocklyJson } = req.body as { newBlocklyJson: BlocklyJson }

		await updateSandboxProject(sandboxProjectId, newBlocklyJson)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project" } satisfies ErrorResponse)
		return
	}
}
