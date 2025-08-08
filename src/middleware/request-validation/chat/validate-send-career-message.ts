import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateSendCareerMessageSchema = Joi.object({
	message: Joi.string().required(),
	careerName: Joi.string().required(),
	careerDescription: Joi.string().required(),
	whatUserSees: Joi.string().required()
}).required().unknown(false)

export default function validateSendCareerMessage(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateSendCareerMessageSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate chatbot request" } satisfies ErrorResponse)
		return
	}
}
