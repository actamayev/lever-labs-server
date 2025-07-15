import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateSendCareerQuestMessageSchema = Joi.object({
	careerQuestChallengeId: Joi.string().required(),
	userCode: Joi.string().allow("").required(),
	interactionType: Joi.string().valid("checkCode", "hint", "generalQuestion").required(),
	message: Joi.string().required()
}).custom((value, helpers) => {
	// Custom validation: generalQuestion requires a message
	if (value.interactionType === "generalQuestion" && !value.message?.trim()) {
		return helpers.error("custom.generalQuestionRequiresMessage")
	}
	return value
}, "General question validation")

export default function validateSendCareerQuestMessage(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateSendCareerQuestMessageSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate chatbot request" } satisfies ErrorResponse)
		return
	}
}
