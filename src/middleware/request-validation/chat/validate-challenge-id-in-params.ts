import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateChallengeIdInParamsSchema = Joi.object({
	challengeId: Joi.string().required()
})

export default function validateChallengeIdInParams(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateChallengeIdInParamsSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate request" } satisfies ErrorResponse)
		return
	}
}
