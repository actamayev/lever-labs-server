import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"
import classCodeValidator from "../../joi/class-code-validator"

const classCodeSchema = Joi.object({
	classCode: classCodeValidator.required()
}).required()

export default function validateClassCode(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = classCodeSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm Class Code is valid" } as ErrorResponse)
		return
	}
}
