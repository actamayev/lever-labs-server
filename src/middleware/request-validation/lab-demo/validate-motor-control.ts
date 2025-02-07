import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"

const motorControlSchema = Joi.object({
	motorControlData: Joi.object({
		pipUUID: pipUUIDValidator.required(),
		leftMotor: Joi.number().valid(-1, 0, 1).required(),
		rightMotor: Joi.number().valid(-1, 0, 1).required()
	})
}).required()

export default function validateMotorControl(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = motorControlSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate motor control" })
		return
	}
}
