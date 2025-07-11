import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const readingUUIDInParamsSchema = Joi.object({
	readingUUID: Joi.string().uuid({ version: "uuidv4" }).required()
}).required()

export default function validateReadingUUIDInParams(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = readingUUIDInParamsSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate reading UUID" } satisfies ErrorResponse)
		return
	}
}
