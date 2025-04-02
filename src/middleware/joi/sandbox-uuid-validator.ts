import Joi from "joi"

// Validator for pipUUID: 5 alphanumeric characters
const sandboxUUIDValidator = Joi
	.string()
	.guid({ version: ["uuidv4", "uuidv5"] })
	.required()

export default sandboxUUIDValidator
