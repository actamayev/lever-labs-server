import { Response, Request } from "express"
import { ErrorResponse, ArcadeScoreRequest } from "@actamayev/lever-labs-common-ts/types/api"
import retrieveAllArcadeScores from "../../db-operations/read/arcade-score/retrieve-all-arcade-scores"

export default async function retrieveAllArcadeScoresController(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const scores = await retrieveAllArcadeScores(userId)

		res.status(200).json({ scores } satisfies ArcadeScoreRequest)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve arcade scores" } satisfies ErrorResponse)
		return
	}
}
