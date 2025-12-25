import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import usernameValidator from "../../joi/username-validator"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const googleUserInfoSchema = Joi.object({
	age: Joi.number().integer().max(120).required(),
	username: usernameValidator.required().trim().min(3).max(100)
}).required()

export default function validateGoogleUserInfo(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = googleUserInfoSchema.validate(req.body)

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
