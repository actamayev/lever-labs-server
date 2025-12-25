import Joi from "joi"
import { isNull, isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ChallengeUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { ErrorResponse, ValidationErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"
import findChallengeIdFromUUID from "../../db-operations/read/find/find-challenge-id-from-uuid"

const attachChallengeIdFromUUIDSchema = Joi.object({
	challengeUUID: Joi.string().uuid({ version: "uuidv4" }).required()
})

export default async function attachChallengeIdFromUUID(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { error } = attachChallengeIdFromUUIDSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		const challengeId = await findChallengeIdFromUUID(req.params.challengeUUID as ChallengeUUID)

		if (isNull(challengeId)) {
			res.status(400).json({ error: "Invalid challenge UUID" } satisfies ErrorResponse)
			return
		}
		req.challengeId = challengeId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate request" } satisfies ErrorResponse)
		return
	}
}
