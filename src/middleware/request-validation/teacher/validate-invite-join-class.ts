import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"
import usernameValidator from "../../joi/username-validator"

const inviteJoinClassSchema = Joi.object({
	username: usernameValidator.required().trim().min(3).max(100)
}).required()

export default function validateInviteJoinClass(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = inviteJoinClassSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm invite join class" } satisfies ErrorResponse)
		return
	}
}
