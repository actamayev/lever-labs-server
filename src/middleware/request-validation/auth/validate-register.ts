import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import emailValidator from "../../joi/email-validator"
import usernameValidator from "../../joi/username-validator"
import passwordValidatorSchema from "../../joi/password-validator"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const registerInformationSchema = Joi.object({
	registerInformation: Joi.object({
		age: Joi.number().integer().max(120).required(),
		email: emailValidator.required().trim(),
		username: usernameValidator.required().trim().min(3).max(100),
		password: passwordValidatorSchema.required(),
		siteTheme: Joi.string().required().trim().valid("light", "dark")
	}).required()
}).required()

export default function validateRegister (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = registerInformationSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Registration" } satisfies ErrorResponse)
		return
	}
}
