import Joi from "joi"
import _ from "lodash"
import { Request, Response, NextFunction } from "express"
import pipUUIdValidator from "../../joi/pip-uuid-validator"

const addPipUUIDSchema = Joi.object({
	pipUUID: pipUUIdValidator.required(),
}).required()

export default function validateAddPipUUID (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = addPipUUIDSchema.validate(req.body)

		if (!_.isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Pip UUID" })
		return
	}
}
