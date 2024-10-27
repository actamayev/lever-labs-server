import Joi from "joi"

const pipUUIdValidator = Joi.string()
	.alphanum()
	.length(6)
	.required()

export default pipUUIdValidator
