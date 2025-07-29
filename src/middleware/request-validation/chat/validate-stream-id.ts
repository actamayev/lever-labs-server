import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateStreamIdSchema = Joi.object({
	streamId: Joi.string().required(),
}).required().unknown(false)

export default function validateStreamId(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateStreamIdSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate stream ID" } satisfies ErrorResponse)
		return
	}
}
