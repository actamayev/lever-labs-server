import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ClassCode, ErrorResponse, MessageResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"
import classCodeValidator from "../../joi/class-code-validator"
import getClassroomIdFromClassCode from "../../../db-operations/read/classroom/get-classroom-id-from-class-code"

const classCodeSchema = Joi.object({
	classCode: classCodeValidator.required()
}).required()

export default async function validateClassCode(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { error } = classCodeSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		const { classCode } = req.params as { classCode: ClassCode }

		const classroomId = await getClassroomIdFromClassCode(classCode)

		if (isUndefined(classroomId)) {
			res.status(400).json({ message: "This class code does not exist" } as MessageResponse)
			return
		}
		req.classroomId = classroomId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm Class Code is valid" } satisfies ErrorResponse)
		return
	}
}
