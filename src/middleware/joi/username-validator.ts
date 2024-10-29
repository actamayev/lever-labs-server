import Joi from "joi"

const usernameValidator = Joi.string().custom((value, helpers) => {
	// Regular expression to exclude  % / ? # [ ] @ ! $ & ' ( ) * + , ; = ^ "
	// eslint-disable-next-line no-useless-escape
	if (/[\/\?%#@\[\]!$&'()*+,;=^]/.test(value)) {
		return helpers.error("string.invalidUsername", { value })
	}
	return value // Return the value if validation passes
}, "Username Validation").messages({
	"string.invalidUsername": "\"{{#label}}\" cannot include special characters: % / ? # [ ] @ ! $ & ' ( ) * + , ; ="
})

export default usernameValidator
