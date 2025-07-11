import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateSendSandboxMessageSchema = Joi.object({
	userCode: Joi.string().allow("").required(),
	message: Joi.string().required(),
})

export default function validateSendSandboxMessage(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateSendSandboxMessageSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate sandbox chatbot request" } satisfies ErrorResponse)
		return
	}
}
