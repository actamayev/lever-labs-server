import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const updateIndividualStudentGarageDisplaySchema = Joi.object({
	studentId: Joi.number().integer().positive().required(),
	garageDisplayStatus: Joi.boolean().required()
}).required()

export default function validateUpdateIndividualStudentGarageDisplay(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = updateIndividualStudentGarageDisplaySchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to validate update individual student garage display status"
		} satisfies ErrorResponse)
		return
	}
}
