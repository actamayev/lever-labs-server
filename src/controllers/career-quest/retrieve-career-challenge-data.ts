import { Response, Request } from "express"
import { CareerProgressData, ErrorResponse} from "@bluedotrobots/common-ts"
import getCQChallengeData from "../../db-operations/read/career-quest-message/get-cq-challenge-data"

export default async function retrieveCareerChallengeData(req: Request, res: Response): Promise<void> {
	try {
		const { userId, careerId } = req

		const cqChallengeData = await getCQChallengeData(userId, careerId)

		res.status(200).json(cqChallengeData satisfies CareerProgressData)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project" } satisfies ErrorResponse)
		return
	}
}
