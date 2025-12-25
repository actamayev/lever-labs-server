import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const changeAudibleStatusSchema = Joi.object({
	audibleStatus: Joi.boolean().required(),
	pipUUID: pipUUIDValidator.required()
}).required()

export default function validateChangeAudibleStatus(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = changeAudibleStatusSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate change audible status" } satisfies ErrorResponse)
		return
	}
}
