import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse , ValidationErrorResponse} from "@bluedotrobots/common-ts"
const editSandboxProjectNotesSchema = Joi.object({
	projectNotes: Joi.string().max(10000).required()
}).required()

export default function validateEditSandboxProjectNotes(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = editSandboxProjectNotesSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate edit sandbox project notes" } as ErrorResponse)
		return
	}
}
