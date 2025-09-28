import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const setHubNewSlideIdSchema = Joi.object({
	hubId: Joi.string().uuid({ version: "uuidv4" }).required(),
	newSlideId: Joi.string().required()
}).required()

export default function validateSetHubNewSlideId(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = setHubNewSlideIdSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate set hub new slide id" } satisfies ErrorResponse)
		return
	}
}
