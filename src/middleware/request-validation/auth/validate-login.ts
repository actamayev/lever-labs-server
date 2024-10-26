import Joi from "joi"
import _ from "lodash"
import { Request, Response, NextFunction } from "express"
import passwordValidatorSchema from "../../joi/password-validator"

const loginInformationSchema = Joi.object({
	loginInformation: Joi.object({
		contact: Joi.string().required().min(3).max(100),
		password: passwordValidatorSchema.required(),
	}).required()
}).required()

export default function validateLogin (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = loginInformationSchema.validate(req.body)

		if (!_.isUndefined(error)) res.status(400).json({ validationError: error.details[0].message })

		const trimmedContact = req.body.loginInformation.contact.trimEnd()
		req.body.loginInformation.contact = trimmedContact

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Login" })
	}
}
