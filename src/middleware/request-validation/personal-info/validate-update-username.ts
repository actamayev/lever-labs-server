import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"

const updateNameSchema = Joi.object({
	username: Joi.string().required().trim().min(3).max(100)
}).required()

export default function validateUpdateUsername (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = updateNameSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: "Invalid username" })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate username" })
		return
	}
}
