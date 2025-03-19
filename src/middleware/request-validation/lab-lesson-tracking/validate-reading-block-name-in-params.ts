import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"

const readingBlockNameInParamsSchema = Joi.object({
	readingBlockName: Joi.string().required()
}).required()

export default function validateReadingBlockNameInParams(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = readingBlockNameInParamsSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate reading block in params" })
		return
	}
}
