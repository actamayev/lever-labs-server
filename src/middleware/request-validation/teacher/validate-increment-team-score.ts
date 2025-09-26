import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts/types/api"

const updateTeamScoreSchema = Joi.object({
	teamNumber: Joi.number().integer().min(1).max(2).required(),
	newScore: Joi.number().integer().min(0).max(1000).required()
}).required()

export default function validateUpdateTeamScore(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = updateTeamScoreSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate update team score" } satisfies ErrorResponse)
		return
	}
}
