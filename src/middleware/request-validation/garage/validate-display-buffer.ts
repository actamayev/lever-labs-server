import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const validateDisplayBufferSchema = Joi.object({
	buffer: Joi.alternatives().try(
		Joi.binary().length(1024),
		Joi.object().pattern(Joi.number().integer().min(0), Joi.number().integer().min(0).max(255))
	).required(),
	pipUUID: pipUUIDValidator.required()
}).required()

export default function validateDisplayBuffer(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateDisplayBufferSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate display buffer" } satisfies ErrorResponse)
		return
	}
}
