import Joi from "joi"
import { isNull, isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"
import { CareerUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import findCareerIdFromUUID from "../../db-operations/read/find/find-career-id-from-uuid"

const attachCareerIdFromUUIDSchema = Joi.object({
	careerUUID: Joi.string().uuid({ version: "uuidv4" }).required()
})

export default async function attachCareerIdFromUUID(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { error } = attachCareerIdFromUUIDSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		const careerId = await findCareerIdFromUUID(req.params.careerUUID as CareerUUID)

		if (isNull(careerId)) {
			res.status(400).json({ error: "Invalid career UUID" } satisfies ErrorResponse)
			return
		}
		req.careerId = careerId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate request" } satisfies ErrorResponse)
		return
	}
}
