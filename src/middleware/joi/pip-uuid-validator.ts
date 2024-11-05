import Joi from "joi"

// Validator for pipUUID: 5 alphanumeric characters, followed by '-X.X.X' (where X is a digit)
const pipUUIDValidator = Joi.string()
	.pattern(/^[a-zA-Z0-9]{5}-\d+\.\d+\.\d+$/)
	.required()

export default pipUUIDValidator
