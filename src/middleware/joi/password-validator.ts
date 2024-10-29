import Joi from "joi"

const passwordValidatorSchema = Joi.string()
	.min(6)
	.max(100)

export default passwordValidatorSchema
