import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"
import addCompletedReadingBlock from "../../db-operations/write/completed-reading-block/add-completed-reading-block"

export default async function markReadingBlockComplete(req: Request, res: Response): Promise<void> {
	try {
		const { userId, readingBlockId } = req

		await addCompletedReadingBlock(readingBlockId, userId)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to mark reading block complete" } satisfies ErrorResponse)
		return
	}
}
