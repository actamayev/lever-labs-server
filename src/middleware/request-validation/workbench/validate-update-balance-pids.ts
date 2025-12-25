import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const updateBalancePidsSchema = Joi.object({
	pipUUID: pipUUIDValidator.required(),
	pValue: Joi.number().required(),
	iValue: Joi.number().required(),
	dValue: Joi.number().required(),
	ffValue: Joi.number().required(),
	targetAngle: Joi.number().required(),
	maxSafeAngleDeviation: Joi.number().required(),
	updateInterval: Joi.number().required(),
	deadbandAngle: Joi.number().required(),
	maxStableRotation: Joi.number().required(),
	minEffectivePwm: Joi.number().integer().required(),
}).required()

export default function validateUpdateBalancePids(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = updateBalancePidsSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate update balance pids" } satisfies ErrorResponse)
		return
	}
}
