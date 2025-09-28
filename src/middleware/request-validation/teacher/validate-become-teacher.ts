import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const becomeTeacherSchema = Joi.object({
	teacherRequestData: Joi.object({
		teacherFirstName: Joi.string().required().max(100),
		teacherLastName: Joi.string().optional().max(200),
		schoolName: Joi.string().optional().max(200),
	}).required()
}).required()

export default function validateBecomeTeacher(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = becomeTeacherSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate teacher data" } satisfies ErrorResponse)
		return
	}
}
