import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import emailValidator from "../../joi/email-validator"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts/types/api"

const subscribeForEmailUpdatesSchema = Joi.object({
	email: emailValidator.required()
}).required()

export default function validateSubscribeForEmailUpdates(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = subscribeForEmailUpdatesSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate email" } satisfies ErrorResponse)
		return
	}
}
