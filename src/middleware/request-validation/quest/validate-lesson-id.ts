import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"

const lessonIdInParamsSchema = Joi.object({
	lessonId: Joi.string().uuid({ version: "uuidv4" }).required()
}).required()

export default function validateLessonId(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = lessonIdInParamsSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate lesson UUID" } satisfies ErrorResponse)
		return
	}
}
