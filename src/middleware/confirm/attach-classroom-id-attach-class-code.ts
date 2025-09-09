import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ClassCode } from "@bluedotrobots/common-ts/types/utils"
import { ErrorResponse, MessageResponse, ValidationErrorResponse } from "@bluedotrobots/common-ts/types/api"
import classCodeValidator from "../joi/class-code-validator"
import getClassroomIdFromClassCode from "../../db-operations/read/classroom/get-classroom-id-from-class-code"

const classCodeSchema = Joi.object({
	classCode: classCodeValidator.required()
}).required()

export default async function attachClassroomIdValidateClassCode(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { error } = classCodeSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		const { classCode } = req.params as { classCode: ClassCode }

		const classroomId = await getClassroomIdFromClassCode(classCode)

		if (isUndefined(classroomId)) {
			res.status(400).json({ message: "This class code does not exist" } satisfies MessageResponse)
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
