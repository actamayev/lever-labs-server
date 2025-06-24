import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateStreamIdSchema = Joi.object({
	streamId: Joi.string().required(),
})

export default function validateStreamId(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateStreamIdSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate stream ID" } as ErrorResponse)
		return
	}
}
