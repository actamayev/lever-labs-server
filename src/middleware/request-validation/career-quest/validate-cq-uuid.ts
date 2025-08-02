import Joi from "joi"
import { isNull, isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"
import findCareerIdFromUUID from "../../../db-operations/read/find/find-career-id-from-uuid"

const cqUUIDSchema = Joi.object({
	currentId: Joi.string().required(), // challengeUUID or textId
	careerUUID: Joi.string().uuid({ version: "uuidv4" }).required(),
	isLocked: Joi.boolean().required()
}).required().unknown(false)

export default async function validateUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { error } = cqUUIDSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}
		const careerId = await findCareerIdFromUUID(req.body.careerUUID)
		if (isNull(careerId)) {
			res.status(400).json({ error: "Invalid career UUID" } satisfies ErrorResponse)
			return
		}
		req.careerId = careerId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate cqUUID" } satisfies ErrorResponse)
		return
	}
}
