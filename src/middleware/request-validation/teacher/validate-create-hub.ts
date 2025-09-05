import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const createHubSchema = Joi.object({
	hubName: Joi.string().required().trim().min(3).max(100),
	careerUUID: Joi.string().uuid({ version: "uuidv4" }).required(),
	slideId: Joi.string().required()
}).required()

export default function validateCreateHub(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = createHubSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate create hub" } satisfies ErrorResponse)
		return
	}
}
