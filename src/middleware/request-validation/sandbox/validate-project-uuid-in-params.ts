import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import sandboxUUIDValidator from "../../joi/sandbox-uuid-validator"

const retrieveSingleSandboxProject = Joi.object({
	projectUUID: sandboxUUIDValidator,
}).required()

export default function validateProjectUUIDInParams(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = retrieveSingleSandboxProject.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to valiate projectUUID" })
		return
	}
}
