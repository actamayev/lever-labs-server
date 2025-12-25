import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import passwordValidatorSchema from "../../joi/password-validator"
import { ErrorResponse, MessageResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const updateNameSchema = Joi.object({
	oldPassword: passwordValidatorSchema.required(),
	newPassword: passwordValidatorSchema.required(),
}).required()

export default function validateUpdateChangePassword(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = updateNameSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: "Invalid password" } satisfies ValidationErrorResponse)
			return
		}

		if (req.body.oldPassword === req.body.newPassword) {
			res.status(400).json({ message: "Your new password can't be the same as the old password" } satisfies MessageResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate password" } satisfies ErrorResponse)
		return
	}
}
