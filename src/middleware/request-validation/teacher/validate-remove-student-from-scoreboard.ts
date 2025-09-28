import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const removeStudentFromScoreboardSchema = Joi.object({
	studentId: Joi.number().integer().min(1).required(),
	scoreboardId: Joi.string().uuid().required(),
	teamNumber: Joi.number().integer().min(1).max(2).required()
}).required()

export default function validateRemoveStudentFromScoreboard(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = removeStudentFromScoreboardSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate remove student from scoreboard" } satisfies ErrorResponse)
		return
	}
}
