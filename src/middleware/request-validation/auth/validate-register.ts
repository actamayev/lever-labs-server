import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import emailValidator from "../../joi/email-validator"
import usernameValidator from "../../joi/username-validator"
import passwordValidatorSchema from "../../joi/password-validator"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const registerInformationSchema = Joi.object({
	registerInformation: Joi.object({
		age: Joi.number().integer().max(120).required(),
		email: emailValidator.required(),
		username: usernameValidator.required().trim().min(3).max(100),
		password: passwordValidatorSchema.required(),
		siteTheme: Joi.string().required().trim().valid("light", "dark")
	}).required()
}).required()

export default function validateRegister (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = registerInformationSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		const trimmedEmail = req.body.registerInformation.email.trimEnd()
		req.body.registerInformation.email = trimmedEmail
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Registration" } as ErrorResponse)
		return
	}
}
