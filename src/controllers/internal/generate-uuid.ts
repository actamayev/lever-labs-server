import { Response, Request } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"

// This is used for generating UUIDs when adding data to the reading_questions.csv and activities.csv, career.csv, and challenge.csv
export default function generateUUID(_req: Request, res: Response): void {
	try {
		const uuid = crypto.randomUUID()
		res.status(200).json({ uuid })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to generate UUID" } satisfies ErrorResponse)
		return
	}
}
