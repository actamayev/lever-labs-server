import Joi from "joi"
import validator from "validator"

const emailValidator = Joi.string().custom((value, helpers) => {
	if (!validator.isEmail(value)) {
		return helpers.error("string.invalidEmail", { value })
	}
	return value
}, "Email Validation").messages({
	"string.invalidEmail": "\"{{#label}}\" must be a valid email address"
})

export default emailValidator
