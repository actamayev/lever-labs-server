import Joi from "joi"
import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const validateCheckCareerQuestCodeSchema = Joi.object({
	careerQuestChallengeId: Joi.string().required(),
	userCode: Joi.string().required()
})

export default function validateCheckCareerQuestCode(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = validateCheckCareerQuestCodeSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate code checking request" } satisfies ErrorResponse)
		return
	}
}
