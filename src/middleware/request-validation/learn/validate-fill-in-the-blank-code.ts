import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const validateFillInTheBlankCodeSchema = Joi.object({
	userCode: Joi.string().allow("").required(),
	fillInTheBlankId: Joi.string().required()
}).required().unknown(false)

export default function validateFillInTheBlankCode(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateFillInTheBlankCodeSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate fill in the blank code" } satisfies ErrorResponse)
		return
	}
}
