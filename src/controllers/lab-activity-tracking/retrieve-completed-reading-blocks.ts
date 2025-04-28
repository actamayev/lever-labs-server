import { Response, Request } from "express"
import retrieveCompletedReadingBlocksDB from "../../db-operations/read/completed-reading-block/retrieve-completed-reading-blocks-db"
import { ErrorResponse } from "@bluedotrobots/common-ts"
export default async function retrieveCompletedReadingBlocks(req: Request, res: Response): Promise<void> {
	try {
		const { userId, activityId } = req
		const completedReadingBlocks = await retrieveCompletedReadingBlocksDB(userId, activityId)

		res.status(200).json({ completedReadingBlocks })
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve completed reading blocks" } as ErrorResponse)
		return
	}
}
