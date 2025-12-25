import Joi from "joi"
import { ACCEPTABLE_PIP_ID_CHARACTERS } from "@actamayev/lever-labs-common-ts/types/utils/constants"

// Validator for pipUUID: 5 characters from the acceptable set
const pipUUIDValidator = Joi.string()
	// eslint-disable-next-line security/detect-non-literal-regexp
	.pattern(new RegExp(`^[${ACCEPTABLE_PIP_ID_CHARACTERS}]{5}$`))
	.required()

export default pipUUIDValidator
