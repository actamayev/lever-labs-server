import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"

const rgbColorSchema = Joi.object({
	r: Joi.number().integer().min(0).max(255).required(),
	g: Joi.number().integer().min(0).max(255).required(),
	b: Joi.number().integer().min(0).max(255).required()
}).required()

const ledColorsBaseSchema = Joi.object({
	topLeftColor: rgbColorSchema,
	topRightColor: rgbColorSchema,
	middleLeftColor: rgbColorSchema,
	middleRightColor: rgbColorSchema,
	backLeftColor: rgbColorSchema,
	backRightColor: rgbColorSchema
}).required()

const ledColorsDirectlySchema = ledColorsBaseSchema.keys({
	pipUUID: pipUUIDValidator.required()
})

export function validateLedColorsDirectly(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = ledColorsDirectlySchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate LED colors" } satisfies ErrorResponse)
		return
	}
}

export function validateLedColorsToAll(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = ledColorsBaseSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate LED colors" } satisfies ErrorResponse)
		return
	}
}
