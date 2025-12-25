import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const validateRequestCareerQuestHintSchema = Joi.object({
	careerUUID: Joi.string().uuid({ version: "uuidv4" }).required(),
	userCode: Joi.string().allow("").required()
}).required().unknown(false)

export default function validateRequestCareerQuestHint(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateRequestCareerQuestHintSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message} satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to validate hint request"
		} satisfies ErrorResponse)
		return
	}
}
