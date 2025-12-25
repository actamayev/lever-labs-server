import { Response, Request } from "express"
import { ErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"

// This is used for generating UUIDs when adding data to the reading_questions.csv and activities.csv, career.csv, and challenge.csv
export default function generateUUID(req: Request, res: Response): void {
	try {
		const { quantity = 1 } = req.body

		// Validate quantity
		if (typeof quantity !== "number" || quantity < 1 || quantity > 1000) {
			res.status(400).json({ error: "Quantity must be a number between 1 and 1000" } satisfies ErrorResponse)
			return
		}

		const uuids = Array.from({ length: quantity }, () => crypto.randomUUID())
		res.status(200).json({ uuids })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to generate UUIDs" } satisfies ErrorResponse)
		return
	}
}
