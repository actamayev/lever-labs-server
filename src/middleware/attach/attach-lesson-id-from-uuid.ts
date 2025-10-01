import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse } from "@lever-labs/common-ts/types/api"
import findLessonIdFromUuid from "../../db-operations/read/lesson/find-lesson-id-from-uuid"

const lessonUuidInParamsSchema = Joi.object({
	lessonUuid: Joi.string().uuid({ version: "uuidv4" }).required()
}).required()

export default async function attachLessonIdFromUuid(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { error } = lessonUuidInParamsSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		const { lessonUuid } = req.params
		const lessonId = await findLessonIdFromUuid(lessonUuid)

		if (!lessonId) {
			res.status(500).json({ error: "Lesson not found" } satisfies ErrorResponse)
			return
		}

		req.lessonId = lessonId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate lesson UUID" } satisfies ErrorResponse)
		return
	}
}
