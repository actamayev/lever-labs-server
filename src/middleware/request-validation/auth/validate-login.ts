import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import passwordValidatorSchema from "../../joi/password-validator"
import { ErrorResponse , ValidationErrorResponse} from "@bluedotrobots/common-ts"
const loginInformationSchema = Joi.object({
	loginInformation: Joi.object({
		contact: Joi.string().required().min(3).max(100),
		password: passwordValidatorSchema.required(),
	}).required()
}).required()

export default function validateLogin (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = loginInformationSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		const trimmedContact = req.body.loginInformation.contact.trimEnd()
		req.body.loginInformation.contact = trimmedContact

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Login" } as ErrorResponse)
		return
	}
}
