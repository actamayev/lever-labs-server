import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIdValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts/types/api"

const addPipToAccountSchema = Joi.object({
	addPipToAccountData: Joi.object({
		pipUUID: pipUUIdValidator.required(),
		pipName: Joi.string().optional().min(3).max(20),
	}).required()
}).required()

export default function validateAddPipToAccount (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = addPipToAccountSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Add Pip to account" } satisfies ErrorResponse)
		return
	}
}
