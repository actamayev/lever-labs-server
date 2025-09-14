import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts/types/api"

const updateIndividualStudentGarageSoundsSchema = Joi.object({
	studentId: Joi.number().integer().positive().required(),
	garageSoundsStatus: Joi.boolean().required()
}).required()

export default function validateUpdateIndividualStudentGarageSounds(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = updateIndividualStudentGarageSoundsSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to validate update individual student garage sounds status"
		} satisfies ErrorResponse)
		return
	}
}
