import Joi from "joi"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse } from "@lever-labs/common-ts/types/api"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import isUndefined from "lodash/isUndefined"

const setSerialConnectionSchema = Joi.object({
	pipUUID: pipUUIDValidator.required(),
	connected: Joi.boolean().required()
})

export default function validateSetSerialConnection(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = setSerialConnectionSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate set serial connection" } satisfies ErrorResponse)
		return
	}
}
