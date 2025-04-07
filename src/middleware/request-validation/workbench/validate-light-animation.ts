import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"

const validateLightAnimationSchema = Joi.object({
	lightAnimation: Joi.string().valid(
		"No animation", "Breathing", "Rainbow", "Strobe", "Turn off", "Fade out", "Pause breathing"
	).required(),
	pipUUID: pipUUIDValidator.required()
}).required()

export default function validateLightAnimation(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateLightAnimationSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate display lights" })
		return
	}
}
