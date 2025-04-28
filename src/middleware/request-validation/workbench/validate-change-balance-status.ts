import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIDValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse , ValidationErrorResponse} from "@bluedotrobots/common-ts"

const changeBalanceStatusSchema = Joi.object({
	balanceStatus: Joi.boolean().required(),
	pipUUID: pipUUIDValidator.required()
}).required()

export default function validateChangeBalanceStatus(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = changeBalanceStatusSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate change balance status" } as ErrorResponse)
		return
	}
}
