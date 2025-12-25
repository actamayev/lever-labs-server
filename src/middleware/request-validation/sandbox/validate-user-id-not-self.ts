import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@actamayev/lever-labs-common-ts/types/api"

export default function validateUserIdNotSelf(req: Request, res: Response, next: NextFunction): void {
	try {
		const { userId } = req
		const { userIdSharedWith } = req.body as { userIdSharedWith: number }

		if (isUndefined(userId) || isUndefined(userIdSharedWith)) {
			res.status(400).json({ message: "userId and userIdSharedWith are required" } satisfies MessageResponse)
			return
		}

		if (userId === userIdSharedWith) {
			res.status(400).json({ message: "Cannot share project with yourself" } satisfies MessageResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate userId not self" } satisfies ErrorResponse)
		return
	}
}

