import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@actamayev/lever-labs-common-ts/types/api"

const joinOrLeaveHubSchema = Joi.object({
	hubId: Joi.string().uuid({ version: "uuidv4" }).required(),
}).required()

export default function validateJoinOrLeaveHub(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = joinOrLeaveHubSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate join or leave hub" } satisfies ErrorResponse)
		return
	}
}
