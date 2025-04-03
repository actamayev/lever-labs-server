import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"

const starSandboxProjectSchema = Joi.object({
	starStatus: Joi.bool().required()
}).required()

export default function validateStarSandboxProject(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = starSandboxProjectSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate star sandbox project schema" })
		return
	}
}
