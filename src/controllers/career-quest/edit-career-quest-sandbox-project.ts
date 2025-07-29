import { Response, Request } from "express"
import { BlocklyJson, 	ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"
import updateCareerQuestSandboxProject from "../../db-operations/write/career-quest-sandbox/update-career-quest-sandbox"

export default async function editCareerQuestSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { userId, challengeId } = req
		const { newBlocklyJson } = req.body as { newBlocklyJson: BlocklyJson }

		await updateCareerQuestSandboxProject(userId, challengeId, newBlocklyJson)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project" } satisfies ErrorResponse)
		return
	}
}
