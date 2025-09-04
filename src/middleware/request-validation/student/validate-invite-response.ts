import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const inviteResponseSchema = Joi.object({
	inviteResponse: Joi.string().valid("accept", "decline").required(),
}).required()

export default function validateInviteResponse(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = inviteResponseSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate invite response" } satisfies ErrorResponse)
		return
	}
}
