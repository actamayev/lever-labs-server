import { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"
import findOrCreateCareerChat from "../../db-operations/write/career-chat/find-or-create-career-chat"

export default async function attachCareerChatId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId, careerId } = req
		const careerChatId = await findOrCreateCareerChat(userId, careerId)

		req.body.careerChatId = careerChatId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to attach career chat id" } satisfies ErrorResponse
		)
		return
	}
}
