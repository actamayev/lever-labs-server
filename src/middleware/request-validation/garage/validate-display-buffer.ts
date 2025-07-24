import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateDisplayBufferSchema = Joi.object({
	buffer: Joi.binary().length(1024).required(), // expects a 1024-byte buffer (Uint8Array)
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
