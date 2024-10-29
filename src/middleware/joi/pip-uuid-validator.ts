import Joi from "joi"

const pipUUIdValidator = Joi.string()
	.alphanum()
	.length(5)
	.required()

export default pipUUIdValidator
