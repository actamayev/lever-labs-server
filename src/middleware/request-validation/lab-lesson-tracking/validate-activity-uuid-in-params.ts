import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const activityUUIDInParamsSchema = Joi.object({
	activityUUID: Joi.string().uuid({ version: "uuidv4" }).required()
}).required()

export default function validateActivityUUIDInParams(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = activityUUIDInParamsSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate activity UUID" } as ErrorResponse)
		return
	}
}
