import Joi from "joi"

const availableBlockSchema = Joi.object({
	type: Joi.string().required(),
	category: Joi.string().valid("sensor", "logic", "action", "loop", "variable").required(),
	description: Joi.string().required(),
	codeTemplate: Joi.string().optional()
})

export const challengeDataSchema = Joi.object({
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
