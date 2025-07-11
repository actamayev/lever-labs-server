import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

const setSandboxNotesOpenStatusSchema = Joi.object({
	isOpen: Joi.bool().required()
}).required()

export default function validateSetSandboxNotesOpenStatus (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = setSandboxNotesOpenStatusSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: "Invalid open status" } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate open status" } satisfies ErrorResponse)
		return
	}
}
