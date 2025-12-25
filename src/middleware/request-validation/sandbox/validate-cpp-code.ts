import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const cppCodeSchema = Joi.object({
	cppCode: Joi.string().required()
}).required()

export default function validateCppCode(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = cppCodeSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate C++ code" } satisfies ErrorResponse)
		return
	}
}
