import { Response, Request } from "express"
import { CareerProgressData, ErrorResponse } from "@lever-labs/common-ts/types/api"
import getUserCareerProgressData from "../../db-operations/read/simultaneous-reads/get-user-career-progress-data"

export default async function retrieveCareerProgressData(req: Request, res: Response): Promise<void> {
	try {
		const { userId, careerId } = req

		const careerProgressData = await getUserCareerProgressData(userId, careerId)

		res.status(200).json(careerProgressData satisfies CareerProgressData)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve career progress data" } satisfies ErrorResponse)
		return
	}
}
