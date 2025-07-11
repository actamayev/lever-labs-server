import isNull from "lodash/isNull"
import { Request, Response, NextFunction } from "express"
import findReadingBlockIdFromReadingName from "../../db-operations/read/find/find-reading-block-id-from-reading-name"
import { ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"

export default async function attachReadingBlockIdFromReadingName(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { readingBlockName } = req.params as { readingBlockName: string }

		const readingBlockId = await findReadingBlockIdFromReadingName(readingBlockName)

		if (isNull(readingBlockId)) {
			res.status(400).json({ message: "Reading Block ID doesn't exist" } satisfies MessageResponse)
			return
		}

		req.readingBlockId = readingBlockId

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to attach reading block ID from reading name" } satisfies ErrorResponse)
		return
	}
}
