import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse } from "@bluedotrobots/common-ts"

const googleLoginAuthCallback = Joi.object({
	idToken: Joi.string().required(),
	siteTheme: Joi.string().required().trim().valid("light", "dark")
}).required()

export default function validateGoogleLoginAuthCallback (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = googleLoginAuthCallback.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Google Login Callback" } as ErrorResponse)
		return
	}
}
