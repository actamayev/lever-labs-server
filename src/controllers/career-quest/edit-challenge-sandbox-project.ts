import { Response, Request } from "express"
import { BlocklyJson, ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"
import updateChallengeSandbox from "../../db-operations/write/challenge-sandbox/update-challenge-sandbox"

export default async function editChallengeSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { userId, challengeId } = req
		const { newBlocklyJson } = req.body as { newBlocklyJson: BlocklyJson }

		await updateChallengeSandbox(userId, challengeId, newBlocklyJson)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit challenge sandbox project" } satisfies ErrorResponse)
		return
	}
}
