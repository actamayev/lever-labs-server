import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const editSandboxProjectSchema = Joi.object({
	newXml: Joi.string().required()
}).required()

export default function validateEditSandboxProject(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = editSandboxProjectSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate edit sandbox project" } as ErrorResponse)
		return
	}
}
