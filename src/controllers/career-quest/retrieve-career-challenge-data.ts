import { Response, Request } from "express"
import { CareerProgressData, ErrorResponse} from "@bluedotrobots/common-ts"
import getUserChallengeData from "../../db-operations/read/challenge-message/get-user-challenge-data"

export default async function retrieveCareerChallengeData(req: Request, res: Response): Promise<void> {
	try {
		const { userId, careerId } = req

		const userChallengeData = await getUserChallengeData(userId, careerId)

		res.status(200).json(userChallengeData satisfies CareerProgressData)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit sandbox project" } satisfies ErrorResponse)
		return
	}
}
