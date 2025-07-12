import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const classroomNameSchema = Joi.object({
	classroomName: Joi.string().required().max(100),
}).required()

export default function validateClassroomName(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = classroomNameSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate classroom name" } satisfies ErrorResponse)
		return
	}
}
