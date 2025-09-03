import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { CareerType, ErrorResponse, ValidationErrorResponse, MeetPipTriggerType } from "@bluedotrobots/common-ts"
import pipUUIDValidator from "../../joi/pip-uuid-validator"

function validateTriggerMessageType(
	careerType: CareerType,
	triggerMessageType: number
): boolean {
	switch (careerType) {
	  case CareerType.MEET_PIP:
		return Object.values(MeetPipTriggerType).includes(triggerMessageType)
	  default:
		return false
	}
}

const triggerMessageSchema = Joi.object({
	careerType: Joi.string().valid(...Object.values(CareerType)).required(),
	triggerMessageType: Joi.number().required(),
	pipUUID: pipUUIDValidator.required()
}).custom((value, helpers) => {
	const { careerType, triggerMessageType } = value
	if (!validateTriggerMessageType(careerType, triggerMessageType)) {
		return helpers.error("any.custom", {
			message: `Invalid triggerMessageType "${triggerMessageType}" for careerType "${careerType}"`
		})
	}
	return value
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
