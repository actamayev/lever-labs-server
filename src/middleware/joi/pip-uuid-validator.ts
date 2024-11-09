import Joi from "joi"

// Validator for pipUUID: 5 alphanumeric characters
const pipUUIDValidator = Joi.string()
	.pattern(/^[a-zA-Z0-9]{5}$/)
	.required()

export default pipUUIDValidator
