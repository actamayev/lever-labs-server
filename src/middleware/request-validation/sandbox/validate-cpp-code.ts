import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import pipUUIdValidator from "../../joi/pip-uuid-validator"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const cppCodeSchema = Joi.object({
	pipUUID: pipUUIdValidator.required(),
	cppCode: Joi.string().required()
}).required()

export default function validateCppCode(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = cppCodeSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate C++ code" } satisfies ErrorResponse)
		return
	}
}
