import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse } from "@lever-labs/common-ts/types/api"

const fillInTheBlankAnswerSchema = Joi.object({
	blocklyJson: Joi.object().required()
}).required()

export default function validateFillInTheBlankAnswer(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = fillInTheBlankAnswerSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate fill in the blank answer" } satisfies ErrorResponse)
		return
	}
}
