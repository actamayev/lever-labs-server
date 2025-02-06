import Joi from "joi"
import isUndefined from "lodash-es/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIdValidator from "../../joi/pip-uuid-validator"

const pipUUIDSchema = Joi.object({
	pipUUID: pipUUIdValidator.required(),
}).required()

export default function validatePipUUID (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = pipUUIDSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm Pip UUID is valid" })
		return
	}
}
