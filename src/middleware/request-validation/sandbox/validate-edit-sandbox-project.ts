import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

const editSandboxProjectSchema = Joi.object({
	newBlocklyJson: Joi.object().required()
}).required()

export default function validateEditSandboxProject(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = editSandboxProjectSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate edit sandbox project" } satisfies ErrorResponse)
		return
	}
}
