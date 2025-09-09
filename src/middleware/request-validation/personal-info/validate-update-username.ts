import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts/types/api"

const updateNameSchema = Joi.object({
	username: Joi.string().required().trim().min(3).max(50)
}).required()

export default function validateUpdateUsername (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = updateNameSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: "Invalid username" } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate username" } satisfies ErrorResponse)
		return
	}
}
