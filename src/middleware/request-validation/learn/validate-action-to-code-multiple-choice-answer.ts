import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse } from "@lever-labs/common-ts/types/api"

const actionToCodeMultipleChoiceAnswerSchema = Joi.object({
	actionToCodeMultipleChoiceId: Joi.string().uuid({ version: "uuidv4" }).required(),
	answerChoiceId: Joi.number().integer().positive().required()
}).required()

export default function validateActionToCodeMultipleChoiceAnswer(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = actionToCodeMultipleChoiceAnswerSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to validate action to code multiple choice answer"
		} satisfies ErrorResponse)
		return
	}
}
