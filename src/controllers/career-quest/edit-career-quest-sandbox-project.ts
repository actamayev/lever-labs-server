import { Response, Request } from "express"
import { BlocklyJson, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"
import updateCareerQuestSandboxProject from "../../db-operations/write/career-quest-sandbox/update-career-quest-sandbox"

export default async function editCareerQuestSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { challengeId } = req.params
		const { newBlocklyJson } = req.body as { newBlocklyJson: BlocklyJson }

		await updateCareerQuestSandboxProject(userId, challengeId, newBlocklyJson)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project" } as ErrorResponse)
		return
	}
}
