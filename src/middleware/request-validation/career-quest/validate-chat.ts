import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const availableBlockSchema = Joi.object({
	type: Joi.string().required(),
	category: Joi.string().valid("sensor", "logic", "action", "loop", "variable").required(),
	description: Joi.string().required(),
	codeTemplate: Joi.string().optional()
})

const challengeDataSchema = Joi.object({
	id: Joi.string().required(),
	title: Joi.string().required(),
	description: Joi.string().required(),
	difficulty: Joi.string().valid("beginner", "intermediate", "advanced").required(),
	availableBlocks: Joi.array().items(availableBlockSchema).required(),
	availableSensors: Joi.array().items(Joi.string()).required(),
	expectedBehavior: Joi.string().required(),
	commonMistakes: Joi.array().items(Joi.string()).required(),
	learningObjectives: Joi.array().items(Joi.string()).required(),
	solutionCode: Joi.string().required(),
	hints: Joi.object({
		level1: Joi.string().required(),
		level2: Joi.string().required(),
		level3: Joi.string().required()
	}).optional()
})

const validateChatbotRequestSchema = Joi.object({
	challengeData: challengeDataSchema.required(),
	userCode: Joi.string().allow("").required(),
	interactionType: Joi.string().valid("checkCode", "hint", "generalQuestion").required(),
	message: Joi.string().allow("").optional(),
	conversationHistory: Joi.array().items(
		Joi.object({
			role: Joi.string().valid("user", "assistant").required(),
			content: Joi.string().required(),
			timestamp: Joi.date().optional()
		})
	).max(20).optional()
}).custom((value, helpers) => {
	// Custom validation: generalQuestion requires a message
	if (value.interactionType === "generalQuestion" && !value.message?.trim()) {
		return helpers.error("custom.generalQuestionRequiresMessage")
	}
	return value
}, "General question validation")

export default function validateChatbotRequest(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateChatbotRequestSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate chatbot request" } as ErrorResponse)
		return
	}
}
