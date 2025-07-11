import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const createClassroomSchema = Joi.object({
	createClassroomData: Joi.object({
		classroomName: Joi.string().required().max(100),
		classroomDescription: Joi.string().optional().max(200),
	}).required()
}).required()

export default function validateCreateClassroom(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = createClassroomSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create classroom" } satisfies ErrorResponse)
		return
	}
}
