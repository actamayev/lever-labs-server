import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const deleteHubSchema = Joi.object({
	hubId: Joi.string().uuid({ version: "uuidv4" }).required()
}).required()

export default function validateDeleteHub(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = deleteHubSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate delete hub" } satisfies ErrorResponse)
		return
	}
}
