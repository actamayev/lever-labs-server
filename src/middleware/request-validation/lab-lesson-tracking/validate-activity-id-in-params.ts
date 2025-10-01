import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const activityIdInParamsSchema = Joi.object({
	activityId: Joi.string().uuid({ version: "uuidv4" }).required()
}).required()

export default function validateActivityIdInParams(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = activityIdInParamsSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate activity Id" } satisfies ErrorResponse)
		return
	}
}
