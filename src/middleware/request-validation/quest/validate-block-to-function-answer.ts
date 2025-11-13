import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse } from "@lever-labs/common-ts/types/api"

const blockToFunctionAnswerSchema = Joi.object({
	answerChoiceId: Joi.number().integer().positive().required()
}).required()

export default function validateBlockToFunctionAnswer(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = blockToFunctionAnswerSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate block to function answer" } satisfies ErrorResponse)
		return
	}
}
