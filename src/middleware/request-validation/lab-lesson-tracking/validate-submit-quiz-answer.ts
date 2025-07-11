import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const submitQuizAnswerSchema = Joi.object({
	readingQuestionAnswerChoiceId: Joi.number().integer().required()
}).required()

export default function validateSubmitQuizAnswer(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = submitQuizAnswerSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate quiz answer submit" } satisfies ErrorResponse)
		return
	}
}
