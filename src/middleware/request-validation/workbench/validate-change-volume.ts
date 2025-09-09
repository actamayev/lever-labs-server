import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts/types/api"

const changeVolumeSchema = Joi.object({
	volume: Joi.number().min(0).max(100).required(),
	pipUUID: pipUUIDValidator.required()
}).required()

export default function validateChangeVolume(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = changeVolumeSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate change volume" } satisfies ErrorResponse)
		return
	}
}
