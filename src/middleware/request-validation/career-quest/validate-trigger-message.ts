import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { CareerType, ErrorResponse, ValidationErrorResponse } from "@bluedotrobots/common-ts"

const triggerMessageSchema = Joi.object({
	careerType: Joi.string().valid(...Object.values(CareerType)).required(),
	triggerMessageType: Joi.string().required()
}).required()

export default function validateCareerTrigger(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = triggerMessageSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate edit sandbox project" } satisfies ErrorResponse)
		return
	}
}
